"""
NAND storage optimization module for Chrome OS.
Optimized for sequential access patterns and reduced I/O operations.
"""

import os
import tempfile
import shutil
import threading
from typing import Optional, List, Generator, Any
from pathlib import Path
import tempfile
import hashlib

# I/O optimization settings
DEFAULT_BUFFER_SIZE = 1024 * 1024  # 1MB buffer for sequential access
MAX_CACHED_FRAMES = 10  # Maximum frames to keep in memory
NAND_WRITE_BATCH_SIZE = 5  # Batch writes for NAND efficiency


class NANDOptimizedPaths:
    """Manages paths with NAND-optimized storage locations."""
    
    def __init__(self, base_dir: Optional[str] = None):
        """
        Initialize NAND-optimized paths.
        
        Args:
            base_dir: Base directory for temporary files. Uses tmpdir if None.
        """
        if base_dir is None:
            base_dir = tempfile.gettempdir()
        
        self.base_dir = base_dir
        self.cache_dir = os.path.join(base_dir, 'dlc_cache')
        self.temp_dir = os.path.join(base_dir, 'dlc_temp')
        
        # Create directories
        for d in [self.cache_dir, self.temp_dir]:
            os.makedirs(d, exist_ok=True)
    
    def get_cache_path(self, filename: str) -> str:
        """Get path in cache directory."""
        return os.path.join(self.cache_dir, filename)
    
    def get_temp_path(self, filename: str) -> str:
        """Get path in temp directory."""
        return os.path.join(self.temp_dir, filename)
    
    def clear_cache(self) -> None:
        """Clear cache directory."""
        if os.path.exists(self.cache_dir):
            shutil.rmtree(self.cache_dir)
            os.makedirs(self.cache_dir, exist_ok=True)
    
    def clear_temp(self) -> None:
        """Clear temp directory."""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            os.makedirs(self.temp_dir, exist_ok=True)
    
    def get_total_size(self) -> int:
        """Get total size of cache and temp in bytes."""
        total = 0
        for d in [self.cache_dir, self.temp_dir]:
            if os.path.exists(d):
                for root, dirs, files in os.walk(d):
                    for f in files:
                        total += os.path.getsize(os.path.join(root, f))
        return total


class StreamingFrameProcessor:
    """
    Process frames in a streaming fashion to minimize disk I/O.
    Optimized for NAND storage with sequential write patterns.
    """
    
    def __init__(self, output_dir: str, batch_size: int = NAND_WRITE_BATCH_SIZE):
        """
        Initialize streaming frame processor.
        
        Args:
            output_dir: Directory for output files
            batch_size: Number of frames to batch before writing
        """
        self.output_dir = output_dir
        self.batch_size = batch_size
        self.frame_buffer = []
        self.frame_buffer_lock = threading.Lock()
        self.writer_thread: Optional[threading.Thread] = None
        self.stop_writer = threading.Event()
        
        os.makedirs(output_dir, exist_ok=True)
    
    def add_frame(self, frame_data: bytes, frame_number: int) -> None:
        """
        Add a frame to the buffer.
        
        Args:
            frame_data: Frame data as bytes
            frame_number: Frame number for filename
        """
        with self.frame_buffer_lock:
            self.frame_buffer.append((frame_number, frame_data))
            
            if len(self.frame_buffer) >= self.batch_size:
                self._flush_buffer()
    
    def _flush_buffer(self) -> None:
        """Flush buffered frames to disk."""
        if not self.frame_buffer:
            return
        
        # Sort by frame number for sequential writes
        sorted_frames = sorted(self.frame_buffer, key=lambda x: x[0])
        self.frame_buffer.clear()
        
        # Write frames sequentially
        for frame_number, frame_data in sorted_frames:
            filepath = os.path.join(
                self.output_dir,
                f'{frame_number:04d}.raw'
            )
            with open(filepath, 'ab') as f:  # Append for NAND efficiency
                f.write(frame_data)
    
    def flush(self) -> None:
        """Flush remaining frames."""
        with self.frame_buffer_lock:
            self._flush_buffer()
    
    def stop(self) -> None:
        """Stop the processor and flush remaining frames."""
        self.stop_writer.set()
        self.flush()


class FrameCache:
    """
    LRU cache for video frames with automatic cleanup.
    Optimized for memory efficiency on Chrome OS.
    """
    
    def __init__(self, max_frames: int = MAX_CACHED_FRAMES):
        """
        Initialize frame cache.
        
        Args:
            max_frames: Maximum number of frames to cache
        """
        self.max_frames = max_frames
        self.cache: dict = {}
        self.access_order: List[int] = []
        self.lock = threading.Lock()
    
    def get(self, frame_number: int) -> Optional[Any]:
        """Get frame from cache."""
        with self.lock:
            if frame_number in self.cache:
                # Move to end (most recently used)
                self.access_order.remove(frame_number)
                self.access_order.append(frame_number)
                return self.cache[frame_number]
        return None
    
    def put(self, frame_number: int, frame: Any) -> None:
        """Put frame in cache with LRU eviction."""
        with self.lock:
            if frame_number in self.cache:
                self.access_order.remove(frame_number)
            elif len(self.cache) >= self.max_frames:
                # Evict oldest
                oldest = self.access_order.pop(0)
                self.cache.pop(oldest, None)
            
            self.cache[frame_number] = frame
            self.access_order.append(frame_number)
    
    def clear(self) -> None:
        """Clear all cached frames."""
        with self.lock:
            self.cache.clear()
            self.access_order.clear()
    
    def __contains__(self, frame_number: int) -> bool:
        return frame_number in self.cache
    
    def __len__(self) -> int:
        return len(self.cache)


def sequential_read(filepath: str, buffer_size: int = DEFAULT_BUFFER_SIZE) -> Generator[bytes, None, None]:
    """
    Generator for sequential file reading.
    Optimized for NAND storage with large sequential reads.
    
    Args:
        filepath: Path to file
        buffer_size: Read buffer size in bytes
        
    Yields:
        Chunks of file data
    """
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(buffer_size)
            if not chunk:
                break
            yield chunk


def sequential_write(filepath: str, data_generator: Generator[bytes, None, None], 
                     buffer_size: int = DEFAULT_BUFFER_SIZE) -> int:
    """
    Write data sequentially from a generator.
    Optimized for NAND storage with buffered writes.
    
    Args:
        filepath: Output file path
        data_generator: Generator yielding data chunks
        buffer_size: Write buffer size
        
    Returns:
        Total bytes written
    """
    total_written = 0
    buffer = []
    buffer_bytes = 0
    
    with open(filepath, 'wb') as f:
        for chunk in data_generator:
            buffer.append(chunk)
            buffer_bytes += len(chunk)
            
            # Flush when buffer is full
            if buffer_bytes >= buffer_size:
                f.write(b''.join(buffer))
                total_written += buffer_bytes
                buffer.clear()
                buffer_bytes = 0
        
        # Flush remaining
        if buffer:
            f.write(b''.join(buffer))
            total_written += buffer_bytes
    
    return total_written


def batch_file_operations(files: List[str], operation: str = 'delete', 
                          batch_size: int = NAND_WRITE_BATCH_SIZE) -> None:
    """
    Perform file operations in batches for NAND efficiency.
    
    Args:
        files: List of file paths
        operation: Operation to perform ('delete', 'copy', 'move')
        batch_size: Number of files to process per batch
    """
    for i in range(0, len(files), batch_size):
        batch = files[i:i + batch_size]
        
        for filepath in batch:
            try:
                if operation == 'delete':
                    if os.path.exists(filepath):
                        os.remove(filepath)
                elif operation == 'copy':
                    # Copy operations would go here
                    pass
                elif operation == 'move':
                    # Move operations would go here
                    pass
            except Exception as e:
                print(f"Error {operation}ing {filepath}: {e}")


def optimize_temp_storage() -> str:
    """
    Get optimal temp storage path for the current system.
    Prefers tmpfs/ramdisk when available for better performance.
    
    Returns:
        Path to optimal temp directory
    """
    # Check for common ramdisk locations
    ramdisk_paths = [
        '/tmp',  # Often tmpfs on Linux
        '/dev/shm',  # RAM disk on Linux
    ]
    
    for path in ramdisk_paths:
        if os.path.exists(path) and os.access(path, os.W_OK):
            # Check if it's likely tmpfs (very fast storage)
            if os.path.ismount(path) or path == '/dev/shm':
                return path
    
    # Fallback to system temp
    return tempfile.gettempdir()


def get_file_checksum(filepath: str) -> str:
    """
    Calculate SHA256 checksum of a file.
    Uses streaming to handle large files efficiently.
    
    Args:
        filepath: Path to file
        
    Returns:
        Hexadecimal checksum string
    """
    sha256 = hashlib.sha256()
    for chunk in sequential_read(filepath):
        sha256.update(chunk)
    return sha256.hexdigest()


class CompressedFrameWriter:
    """
    Write frames with compression to reduce I/O.
    Optimized for NAND storage with better space efficiency.
    """
    
    def __init__(self, output_path: str, compression_level: int = 6):
        """
        Initialize compressed frame writer.
        
        Args:
            output_path: Output file path
            compression_level: zlib compression level (0-9)
        """
        self.output_path = output_path
        self.compression_level = compression_level
        self.frame_index: List[tuple] = []  # (frame_number, offset, size)
        self.file_handle: Optional[Any] = None
        self.current_offset = 0
    
    def __enter__(self):
        self.file_handle = open(self.output_path, 'wb')
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.file_handle:
            self.file_handle.close()
        return False
    
    def write_frame(self, frame_data: bytes, frame_number: int) -> None:
        """
        Write a compressed frame.
        
        Args:
            frame_data: Raw frame data
            frame_number: Frame number for indexing
        """
        import zlib
        
        compressed = zlib.compress(frame_data, self.compression_level)
        
        # Store index entry
        self.frame_index.append((
            frame_number,
            self.current_offset,
            len(compressed)
        ))
        
        # Write compressed data
        self.file_handle.write(compressed)
        self.current_offset += len(compressed)
    
    def write_index(self) -> None:
        """Write frame index at end of file."""
        import struct
        
        if not self.file_handle:
            return
        
        # Write index header
        self.file_handle.write(b'DLCIDX')
        
        # Write number of entries
        self.file_handle.write(struct.pack('<I', len(self.frame_index)))
        
        # Write index entries
        for frame_number, offset, size in self.frame_index:
            self.file_handle.write(struct.pack('<IQ', frame_number, offset))
            self.file_handle.write(struct.pack('<I', size))


def extract_frames_nand_optimized(
    video_path: str,
    output_dir: str,
    max_resolution: int = 720,
    target_fps: int = 15
) -> List[str]:
    """
    Extract frames from video with NAND optimization.
    
    Args:
        video_path: Path to input video
        output_dir: Output directory for frames
        max_resolution: Maximum resolution to extract
        target_fps: Target frames per second
        
    Returns:
        List of extracted frame paths
    """
    import cv2
    
    os.makedirs(output_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = max(1, int(fps / target_fps))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Calculate scaled dimensions
    if max(width, height) > max_resolution:
        scale = max_resolution / max(width, height)
        new_width = int(width * scale)
        new_height = int(height * scale)
    else:
        new_width = width
        new_height = height
    
    frame_paths = []
    frame_number = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Skip frames to match target FPS
        if frame_number % frame_interval != 0:
            frame_number += 1
            continue
        
        # Resize if needed
        if (new_width, new_height) != (width, height):
            frame = cv2.resize(frame, (new_width, new_height))
        
        # Save frame with sequential naming for better NAND performance
        frame_path = os.path.join(output_dir, f'{frame_number:04d}.jpg')
        cv2.imwrite(frame_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        frame_paths.append(frame_path)
        
        frame_number += 1
    
    cap.release()
    return frame_paths


# Global NAND-optimized paths instance
_nand_paths: Optional[NANDOptimizedPaths] = None


def get_nand_paths() -> NANDOptimizedPaths:
    """Get global NAND-optimized paths instance."""
    global _nand_paths
    if _nand_paths is None:
        _nand_paths = NANDOptimizedPaths(optimize_temp_storage())
    return _nand_paths


def cleanup_nand_temp() -> None:
    """Clean up NAND temporary files."""
    paths = get_nand_paths()
    paths.clear_temp()
    paths.clear_cache()
