"""
Memory optimization module for Chrome OS devices.
Optimized for low-memory environments with NAND storage.
"""

import os
import gc
import threading
from typing import Optional, Callable, Any
from functools import wraps
import contextlib

# Memory thresholds (in bytes)
DEFAULT_MEMORY_LIMIT = 1024 * 1024 * 1024  # 1GB default for Chrome OS
LOW_MEMORY_THRESHOLD = 512 * 1024 * 1024  # 512MB
CRITICAL_MEMORY_THRESHOLD = 256 * 1024 * 1024  # 256MB

# Global state
_current_memory_limit = DEFAULT_MEMORY_LIMIT
_memory_lock = threading.Lock()


def get_memory_usage() -> int:
    """Get current process memory usage in bytes."""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss
    except ImportError:
        # Fallback using resource module
        import resource
        return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024


def get_available_memory() -> int:
    """Get available system memory in bytes."""
    try:
        import psutil
        return psutil.virtual_memory().available
    except ImportError:
        return DEFAULT_MEMORY_LIMIT


def set_memory_limit(limit_bytes: int) -> None:
    """Set memory limit for the application."""
    global _current_memory_limit
    _current_memory_limit = limit_bytes


def get_memory_limit() -> int:
    """Get current memory limit."""
    return _current_memory_limit


def check_memory_available(required_bytes: int) -> bool:
    """Check if there's enough memory available."""
    current_usage = get_memory_usage()
    available = get_available_memory()
    return (current_usage + required_bytes) < min(available, _current_memory_limit)


def estimate_frame_memory(width: int, height: int, channels: int = 3) -> int:
    """Estimate memory required for a frame in bytes."""
    return width * height * channels


def optimize_for_chrome_os() -> None:
    """
    Apply Chrome OS specific memory optimizations.
    Call this early in the application startup.
    """
    import psutil
    from modules.globals import max_memory
    
    # Detect available memory
    vm = psutil.virtual_memory()
    total_memory = vm.total
    
    # Calculate appropriate limits
    if total_memory <= 2 * 1024**3:  # 2GB or less
        # Very low memory device
        gc.collect()
        set_memory_limit(512 * 1024 * 1024)  # 512MB limit
        
        # Set environment variables for better memory management
        os.environ['OMP_NUM_THREADS'] = '2'
        os.environ['MKL_NUM_THREADS'] = '2'
        os.environ['OPENBLAS_NUM_THREADS'] = '2'
        
    elif total_memory <= 4 * 1024**3:  # 4GB or less
        # Low memory device
        gc.collect()
        set_memory_limit(1024 * 1024 * 1024)  # 1GB limit
        
        os.environ['OMP_NUM_THREADS'] = '4'
        os.environ['MKL_NUM_THREADS'] = '4'
        os.environ['OPENBLAS_NUM_THREADS'] = '4'
    else:
        # Normal device
        if max_memory:
            set_memory_limit(max_memory * 1024**3)
    
    print(f"[MEMORY] Chrome OS optimization: limit set to {_current_memory_limit / 1024**3:.1f}GB")


def memory_efficient_gc() -> None:
    """Force garbage collection when memory is low."""
    current = get_memory_usage()
    
    if current > LOW_MEMORY_THRESHOLD:
        gc.collect()
        
    if current > CRITICAL_MEMORY_THRESHOLD:
        # Aggressive cleanup
        gc.collect(2)
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass


@contextlib.contextmanager
def memory_guard(required_bytes: int, operation_name: str = "operation"):
    """
    Context manager to guard memory-intensive operations.
    Automatically cleans up if memory is insufficient.
    """
    if not check_memory_available(required_bytes):
        print(f"[MEMORY] Warning: Insufficient memory for {operation_name}, attempting cleanup...")
        memory_efficient_gc()
        
        if not check_memory_available(required_bytes):
            raise MemoryError(f"Insufficient memory for {operation_name}")
    
    try:
        yield
    finally:
        memory_efficient_gc()


def memory_optimized(default_limit: int = DEFAULT_MEMORY_LIMIT):
    """
    Decorator for memory optimization.
    Reduces memory usage for decorated functions on Chrome OS.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            gc.collect()
            try:
                return func(*args, **kwargs)
            finally:
                memory_efficient_gc()
        return wrapper
    return decorator


class StreamingBuffer:
    """
    Memory-efficient streaming buffer for processing data in chunks.
    Optimized for NAND storage with sequential access patterns.
    """
    
    def __init__(self, chunk_size: int = 1024 * 1024, max_chunks: int = 4):
        """
        Initialize streaming buffer.
        
        Args:
            chunk_size: Size of each chunk in bytes
            max_chunks: Maximum number of chunks to keep in memory
        """
        self.chunk_size = chunk_size
        self.max_chunks = max_chunks
        self.chunks = []
        self.total_size = 0
    
    def add(self, data: bytes) -> None:
        """Add data to buffer."""
        remaining = data
        while len(remaining) > 0:
            if len(self.chunks) >= self.max_chunks:
                # Write oldest chunk to make room
                self._flush_chunk(0)
            
            chunk = remaining[:self.chunk_size]
            self.chunks.append(chunk)
            remaining = remaining[self.chunk_size:]
            self.total_size += len(chunk)
    
    def _flush_chunk(self, index: int) -> bytes:
        """Flush a chunk and return its data."""
        if index < len(self.chunks):
            chunk = self.chunks.pop(index)
            self.total_size -= len(chunk)
            return chunk
        return b''
    
    def read_all(self) -> bytes:
        """Read all buffered data."""
        return b''.join(self.chunks)
    
    def clear(self) -> None:
        """Clear all buffered data."""
        self.chunks.clear()
        self.total_size = 0
    
    def __len__(self) -> int:
        return self.total_size


class ModelCache:
    """
    LRU cache for models with memory limits.
    Optimized for Chrome OS with automatic cleanup.
    """
    
    def __init__(self, max_size_mb: int = 500):
        """
        Initialize model cache.
        
        Args:
            max_size_mb: Maximum cache size in MB
        """
        self.max_size = max_size_mb * 1024 * 1024
        self.current_size = 0
        self.cache = {}
        self.access_order = []
        self.lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """Get item from cache."""
        with self.lock:
            if key in self.cache:
                # Move to end (most recently used)
                self.access_order.remove(key)
                self.access_order.append(key)
                return self.cache[key]
        return None
    
    def put(self, key: str, value: Any, size: int) -> None:
        """
        Put item in cache.
        
        Args:
            key: Cache key
            value: Object to cache
            size: Size of object in bytes
        """
        with self.lock:
            # Remove if already exists
            if key in self.cache:
                old_size = self._get_item_size(self.cache[key])
                self.current_size -= old_size
                self.access_order.remove(key)
            
            # Make space if needed
            while self.current_size + size > self.max_size and self.access_order:
                self._evict_oldest()
            
            # Add new item
            self.cache[key] = value
            self.access_order.append(key)
            self.current_size += size
    
    def _evict_oldest(self) -> None:
        """Evict least recently used item."""
        if self.access_order:
            oldest = self.access_order.pop(0)
            if oldest in self.cache:
                item = self.cache.pop(oldest)
                self.current_size -= self._get_item_size(item)
                
                # Try to free memory
                del item
    
    def _get_item_size(self, item: Any) -> int:
        """Estimate size of cached item."""
        try:
            import sys
            return sys.getsizeof(item)
        except:
            return 1024 * 1024  # Default 1MB estimate
    
    def clear(self) -> None:
        """Clear all cached items."""
        with self.lock:
            self.cache.clear()
            self.access_order.clear()
            self.current_size = 0
            gc.collect()


# Global model cache instance
_model_cache = ModelCache()


def get_model_cache() -> ModelCache:
    """Get global model cache instance."""
    return _model_cache


def clear_model_cache() -> None:
    """Clear global model cache."""
    _model_cache.clear()
