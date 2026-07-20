"""
Adaptive quality settings for Chrome OS.
Automatically adjusts quality based on device capabilities and performance.
"""

import os
import time
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum


class QualityMode(Enum):
    """Quality modes for different use cases."""
    PERFORMANCE = "performance"  # Lowest latency, reduced quality
    BALANCED = "balanced"       # Balance between quality and performance
    QUALITY = "quality"         # Best quality, higher latency


class DeviceProfile(Enum):
    """Device capability profiles."""
    LOW = "low"         # 2GB RAM, 2 cores
    MEDIUM = "medium"   # 4GB RAM, 4 cores
    HIGH = "high"      # 8GB+ RAM, 6+ cores


@dataclass
class QualitySettings:
    """Quality settings for face swap processing."""
    max_resolution: int = 720
    target_fps: int = 15
    face_enhancer: bool = False
    color_correction: bool = True
    poisson_blend: bool = True
    max_faces: int = 1
    detection_interval: int = 3  # Detect faces every N frames
    model_cache_size: int = 100  # MB
    enable_gpu: bool = True
    num_threads: int = 4
    
    # NAND-specific settings
    use_memory_streaming: bool = True
    cache_frames: bool = True
    max_cached_frames: int = 10
    compression_enabled: bool = True


@dataclass
class DeviceCapabilities:
    """Detected device capabilities."""
    profile: DeviceProfile = DeviceProfile.MEDIUM
    total_memory_gb: float = 4.0
    available_memory_gb: float = 2.0
    cpu_cores: int = 4
    has_gpu: bool = False
    gpu_name: str = ""
    is_chrome_os: bool = False
    storage_type: str = "unknown"  # ssd, nand, emmc
    
    # Performance metrics
    benchmark_score: float = 0.0
    inference_time_ms: float = 0.0


class AdaptiveQualityManager:
    """
    Manages adaptive quality settings based on device capabilities.
    Monitors performance and adjusts settings dynamically.
    """
    
    def __init__(self):
        """Initialize adaptive quality manager."""
        self.capabilities = DeviceCapabilities()
        self.settings = QualitySettings()
        self.quality_mode = QualityMode.BALANCED
        
        # Performance monitoring
        self.frame_times: list = []
        self.max_frame_times: int = 60  # Keep last 60 frame times
        self.last_adjustment_time: float = 0
        self.adjustment_cooldown: float = 5.0  # Seconds between adjustments
        
        # Callbacks
        self.on_settings_changed: Optional[Callable[[QualitySettings], None]] = None
    
    def detect_capabilities(self) -> DeviceCapabilities:
        """
        Detect device capabilities.
        
        Returns:
            DeviceCapabilities object with detected hardware info
        """
        import platform
        import psutil
        
        # Basic system info
        self.capabilities.is_chrome_os = 'Chromium' in platform.release() or 'Chrome OS' in platform.release()
        
        # Memory info
        vm = psutil.virtual_memory()
        self.capabilities.total_memory_gb = vm.total / (1024**3)
        self.capabilities.available_memory_gb = vm.available / (1024**3)
        
        # CPU info
        self.capabilities.cpu_cores = os.cpu_count() or 4
        
        # Classify device
        if self.capabilities.total_memory_gb <= 2 and self.capabilities.cpu_cores <= 2:
            self.capabilities.profile = DeviceProfile.LOW
        elif self.capabilities.total_memory_gb <= 4 and self.capabilities.cpu_cores <= 4:
            self.capabilities.profile = DeviceProfile.MEDIUM
        else:
            self.capabilities.profile = DeviceProfile.HIGH
        
        # Check for GPU (simplified)
        try:
            import torch
            self.capabilities.has_gpu = torch.cuda.is_available()
            if self.capabilities.has_gpu:
                self.capabilities.gpu_name = torch.cuda.get_device_name(0)
        except ImportError:
            pass
        
        # Detect storage type (Chrome OS typically has eMMC or NAND)
        if self.capabilities.is_chrome_os:
            # Chrome OS devices typically have eMMC or NAND
            self.capabilities.storage_type = "emmc"  # Conservative default
        else:
            # Try to detect
            try:
                import subprocess
                result = subprocess.run(
                    ['cat', '/sys/block/sda/queue/rotational'],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    # 0 = SSD, 1 = HDD
                    self.capabilities.storage_type = "ssd" if result.stdout.strip() == "0" else "hdd"
            except:
                pass
        
        return self.capabilities
    
    def apply_profile_settings(self) -> QualitySettings:
        """
        Apply settings based on detected device profile.
        
        Returns:
            QualitySettings with profile-appropriate values
        """
        profile = self.capabilities.profile
        
        if profile == DeviceProfile.LOW:
            self.settings = QualitySettings(
                max_resolution=480,
                target_fps=10,
                face_enhancer=False,
                color_correction=False,
                poisson_blend=True,
                max_faces=1,
                detection_interval=5,
                model_cache_size=256,
                enable_gpu=False,
                num_threads=2,
                use_memory_streaming=True,
                cache_frames=True,
                max_cached_frames=5,
                compression_enabled=True
            )
        elif profile == DeviceProfile.MEDIUM:
            self.settings = QualitySettings(
                max_resolution=720,
                target_fps=15,
                face_enhancer=False,
                color_correction=True,
                poisson_blend=True,
                max_faces=2,
                detection_interval=3,
                model_cache_size=512,
                enable_gpu=True,
                num_threads=4,
                use_memory_streaming=True,
                cache_frames=True,
                max_cached_frames=10,
                compression_enabled=True
            )
        else:  # HIGH
            self.settings = QualitySettings(
                max_resolution=1080,
                target_fps=30,
                face_enhancer=True,
                color_correction=True,
                poisson_blend=True,
                max_faces=5,
                detection_interval=1,
                model_cache_size=1024,
                enable_gpu=True,
                num_threads=6,
                use_memory_streaming=False,
                cache_frames=False,
                max_cached_frames=30,
                compression_enabled=False
            )
        
        # Apply quality mode adjustments
        self._apply_quality_mode()
        
        return self.settings
    
    def _apply_quality_mode(self) -> None:
        """Apply quality mode overrides to settings."""
        if self.quality_mode == QualityMode.PERFORMANCE:
            self.settings.max_resolution = min(self.settings.max_resolution, 480)
            self.settings.target_fps = min(self.settings.target_fps, 15)
            self.settings.face_enhancer = False
            self.settings.detection_interval = max(self.settings.detection_interval, 3)
        elif self.quality_mode == QualityMode.QUALITY:
            self.settings.max_resolution = min(self.settings.max_resolution, 1080)
            self.settings.target_fps = max(self.settings.target_fps, 24)
            self.settings.face_enhancer = True
            self.settings.detection_interval = 1
    
    def set_quality_mode(self, mode: QualityMode) -> QualitySettings:
        """
        Set quality mode and update settings.
        
        Args:
            mode: Quality mode to apply
            
        Returns:
            Updated QualitySettings
        """
        self.quality_mode = mode
        self._apply_quality_mode()
        
        if self.on_settings_changed:
            self.on_settings_changed(self.settings)
        
        return self.settings
    
    def record_frame_time(self, frame_time_ms: float) -> None:
        """
        Record frame processing time for adaptive adjustment.
        
        Args:
            frame_time_ms: Time to process one frame in milliseconds
        """
        self.frame_times.append(frame_time_ms)
        
        # Keep only recent frame times
        if len(self.frame_times) > self.max_frame_times:
            self.frame_times.pop(0)
        
        # Update inference time estimate
        if self.frame_times:
            self.capabilities.inference_time_ms = sum(self.frame_times) / len(self.frame_times)
    
    def should_adjust(self) -> bool:
        """Check if enough time has passed since last adjustment."""
        return time.time() - self.last_adjustment_time >= self.adjustment_cooldown
    
    def auto_adjust(self) -> Optional[QualitySettings]:
        """
        Automatically adjust quality based on performance.
        
        Returns:
            Updated QualitySettings if adjusted, None otherwise
        """
        if not self.should_adjust() or not self.frame_times:
            return None
        
        avg_time = self.capabilities.inference_time_ms
        target_time = 1000 / self.settings.target_fps
        
        # Calculate performance ratio
        performance_ratio = avg_time / target_time if target_time > 0 else 1.0
        
        adjusted = False
        
        # Adjust based on performance
        if performance_ratio > 1.5:  # Too slow
            # Reduce quality
            if self.settings.max_resolution > 480:
                self.settings.max_resolution -= 120
                adjusted = True
            elif self.settings.target_fps > 10:
                self.settings.target_fps -= 2
                adjusted = True
            elif self.settings.face_enhancer:
                self.settings.face_enhancer = False
                adjusted = True
            elif self.settings.detection_interval < 5:
                self.settings.detection_interval += 1
                adjusted = True
        
        elif performance_ratio < 0.5:  # Plenty of headroom
            # Can increase quality
            if self.settings.max_resolution < 1080 and self.capabilities.profile != DeviceProfile.LOW:
                self.settings.max_resolution += 120
                adjusted = True
            elif self.settings.target_fps < 30:
                self.settings.target_fps += 2
                adjusted = True
        
        if adjusted:
            self.last_adjustment_time = time.time()
            
            if self.on_settings_changed:
                self.on_settings_changed(self.settings)
        
        return self.settings if adjusted else None
    
    def get_current_settings(self) -> QualitySettings:
        """Get current quality settings."""
        return self.settings
    
    def get_recommended_settings(self) -> dict:
        """
        Get recommended settings as a dictionary for UI display.
        
        Returns:
            Dictionary with setting recommendations
        """
        return {
            'profile': self.capabilities.profile.value,
            'profile_label': self._get_profile_label(),
            'quality_mode': self.quality_mode.value,
            'max_resolution': self.settings.max_resolution,
            'target_fps': self.settings.target_fps,
            'face_enhancer': self.settings.face_enhancer,
            'current_inference_ms': round(self.capabilities.inference_time_ms, 1),
            'available_memory_gb': round(self.capabilities.available_memory_gb, 1),
            'recommendations': self._get_recommendations()
        }
    
    def _get_profile_label(self) -> str:
        """Get human-readable profile label."""
        labels = {
            DeviceProfile.LOW: "Low-end Device (2GB RAM)",
            DeviceProfile.MEDIUM: "Standard Device (4GB RAM)",
            DeviceProfile.HIGH: "High-end Device (8GB+ RAM)"
        }
        return labels.get(self.capabilities.profile, "Unknown")
    
    def _get_recommendations(self) -> list:
        """Get list of recommendations based on current settings."""
        recommendations = []
        
        if self.capabilities.profile == DeviceProfile.LOW:
            recommendations.append({
                'type': 'info',
                'message': 'Using reduced settings for smooth performance'
            })
        
        if self.capabilities.storage_type in ('emmc', 'nand'):
            recommendations.append({
                'type': 'info',
                'message': 'NAND storage detected - using memory streaming'
            })
        
        if self.settings.face_enhancer and self.capabilities.profile == DeviceProfile.LOW:
            recommendations.append({
                'type': 'warning',
                'message': 'Face enhancer may be slow on this device'
            })
        
        return recommendations


# Global instance
_adaptive_manager: Optional[AdaptiveQualityManager] = None


def get_adaptive_manager() -> AdaptiveQualityManager:
    """Get global adaptive quality manager instance."""
    global _adaptive_manager
    if _adaptive_manager is None:
        _adaptive_manager = AdaptiveQualityManager()
    return _adaptive_manager


def initialize_for_chrome_os() -> QualitySettings:
    """
    Initialize adaptive quality for Chrome OS.
    Convenience function to set up everything at once.
    
    Returns:
        Initial QualitySettings
    """
    manager = get_adaptive_manager()
    manager.detect_capabilities()
    return manager.apply_profile_settings()


def apply_chrome_os_optimizations() -> None:
    """Apply Chrome OS specific environment optimizations."""
    # Set thread limits for multi-core Chrome devices
    cpu_count = os.cpu_count() or 4
    
    # Adjust based on available memory
    try:
        import psutil
        vm = psutil.virtual_memory()
        available_gb = vm.available / (1024**3)
        
        if available_gb < 2:
            # Very limited memory
            os.environ['OMP_NUM_THREADS'] = '2'
            os.environ['MKL_NUM_THREADS'] = '2'
        elif available_gb < 4:
            # Moderate memory
            os.environ['OMP_NUM_THREADS'] = str(min(4, cpu_count))
            os.environ['MKL_NUM_THREADS'] = str(min(4, cpu_count))
        else:
            # Plenty of memory
            os.environ['OMP_NUM_THREADS'] = str(cpu_count)
            os.environ['MKL_NUM_THREADS'] = str(cpu_count)
    except ImportError:
        pass
    
    # Disable TensorFlow logging for cleaner output
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    
    print("[ADAPTIVE] Chrome OS optimizations applied")
