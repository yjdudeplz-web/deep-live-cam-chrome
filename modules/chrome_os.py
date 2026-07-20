"""
Chrome OS integration module for Deep-Live-Cam.
Provides initialization and optimization for Chrome OS environments.
"""

import os
import sys
import platform
from typing import Optional

# Chrome OS detection
IS_CHROME_OS = (
    'Chromium' in platform.release() or
    'Chrome OS' in platform.release() or
    os.environ.get('CHROMEOS_RELEASE_NAME') is not None
)


def is_running_on_chrome_os() -> bool:
    """Check if running on Chrome OS."""
    return IS_CHROME_OS


def detect_storage_type() -> str:
    """
    Detect the type of storage on the system.
    
    Returns:
        'ssd', 'nand', 'emmc', or 'unknown'
    """
    # Check Chrome OS
    if IS_CHROME_OS:
        try:
            with open('/proc/cmdline', 'r') as f:
                cmdline = f.read()
                if 'efi' in cmdline or 'crosvm' in cmdline:
                    return 'ssd'  # Usually backed by SSD
        except:
            pass
        return 'emmc'  # Chrome OS devices typically use eMMC
    
    # Linux detection
    try:
        # Check if we're on a VM or container
        with open('/proc/cpuinfo', 'r') as f:
            if 'hypervisor' in f.read().lower():
                return 'ssd'  # VMs typically use SSD storage
    except:
        pass
    
    # Check block device type
    for device in ['sda', 'nvme0n1', 'mmcblk0']:
        path = f'/sys/block/{device}/queue/rotational'
        try:
            with open(path, 'r') as f:
                rotational = f.read().strip()
                if rotational == '0':
                    return 'ssd'
                else:
                    return 'hdd'
        except:
            continue
    
    return 'unknown'


def optimize_environment() -> None:
    """
    Apply Chrome OS specific environment optimizations.
    Should be called early in the application startup.
    """
    if not IS_CHROME_OS:
        return
    
    print("[CHROME-OS] Chrome OS detected - applying optimizations...")
    
    # Storage type detection
    storage_type = detect_storage_type()
    print(f"[CHROME-OS] Storage type: {storage_type}")
    
    # Import and apply memory optimizations
    try:
        from modules.memory_optimize import optimize_for_chrome_os, set_memory_limit
        optimize_for_chrome_os()
    except ImportError:
        print("[CHROME-OS] Warning: memory_optimize module not available")
    
    # Import and apply adaptive quality settings
    try:
        from modules.adaptive_quality import apply_chrome_os_optimizations
        apply_chrome_os_optimizations()
    except ImportError:
        print("[CHROME-OS] Warning: adaptive_quality module not available")
    
    # Set Chrome OS specific environment variables
    os.environ['CHROMEOS'] = '1'
    
    if storage_type in ('nand', 'emmc'):
        os.environ['CHROMEOS_STORAGE_TYPE'] = storage_type
        print(f"[CHROME-OS] NAND/eMMC optimizations enabled")
    
    # Reduce logging for cleaner output
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    
    print("[CHROME-OS] Environment optimization complete")


def get_chrome_os_settings() -> dict:
    """
    Get Chrome OS specific settings.
    
    Returns:
        Dictionary with Chrome OS specific configuration
    """
    storage_type = detect_storage_type()
    
    settings = {
        'is_chrome_os': IS_CHROME_OS,
        'storage_type': storage_type,
        'use_memory_streaming': storage_type in ('nand', 'emmc'),
        'compression_enabled': storage_type in ('nand', 'emmc'),
        'max_resolution': 720,  # Default for Chrome OS
        'target_fps': 15,
        'num_threads': min(os.cpu_count() or 4, 4),  # Limit threads on Chrome OS
    }
    
    # Adjust based on memory
    try:
        import psutil
        vm = psutil.virtual_memory()
        total_gb = vm.total / (1024**3)
        
        if total_gb <= 2:
            settings['max_resolution'] = 480
            settings['target_fps'] = 10
            settings['num_threads'] = 2
        elif total_gb <= 4:
            settings['max_resolution'] = 720
            settings['target_fps'] = 15
        else:
            settings['max_resolution'] = 1080
            settings['target_fps'] = 30
    except ImportError:
        pass
    
    return settings


def init_chrome_os_support() -> bool:
    """
    Initialize Chrome OS support.
    Call this at application startup.
    
    Returns:
        True if running on Chrome OS, False otherwise
    """
    if not IS_CHROME_OS:
        return False
    
    optimize_environment()
    return True


# Auto-initialize if running on Chrome OS
if IS_CHROME_OS and __name__ != '__main__':
    init_chrome_os_support()
