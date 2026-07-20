"""
Model compression utilities for Chrome OS deployment.
Provides ONNX model optimization and quantization for lower-end devices.
"""

import os
import tempfile
from typing import Optional, List, Tuple
from pathlib import Path
import shutil


class ModelCompressor:
    """
    Compress and optimize ONNX models for Chrome OS deployment.
    Supports quantization, pruning, and layer fusion.
    """
    
    def __init__(self, output_dir: Optional[str] = None):
        """
        Initialize model compressor.
        
        Args:
            output_dir: Directory for compressed models. Uses temp dir if None.
        """
        if output_dir is None:
            output_dir = tempfile.gettempdir()
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def quantize_model(
        self,
        model_path: str,
        quantization_type: str = 'int8',
        optimize_level: int = 99
    ) -> str:
        """
        Quantize ONNX model to reduce size.
        
        Args:
            model_path: Path to input ONNX model
            quantization_type: 'int8', 'uint8', or 'fp16'
            optimize_level: ONNX optimization level (0-99)
            
        Returns:
            Path to quantized model
        """
        import onnx
        from onnx import numpy_helper, helper
        
        # Load model
        model = onnx.load(model_path)
        
        # Create quantized model based on type
        if quantization_type == 'fp16':
            return self._convert_to_fp16(model, model_path)
        elif quantization_type in ('int8', 'uint8'):
            return self._quantize_to_int(model, model_path, quantization_type)
        
        return model_path
    
    def _convert_to_fp16(self, model, original_path: str) -> str:
        """
        Convert model to FP16 precision.
        
        Args:
            model: ONNX model
            original_path: Original model path
            
        Returns:
            Path to FP16 model
        """
        from onnxconverter_common import float16
        
        # Convert to FP16
        model_fp16 = float16.convert_float16_to_float(model)
        
        # Save
        output_path = self._get_output_path(original_path, 'fp16')
        onnx.save(model_fp16, output_path)
        
        return output_path
    
    def _quantize_to_int(self, model, original_path: str, dtype: str) -> str:
        """
        Quantize model to INT8/UINT8.
        
        Args:
            model: ONNX model
            original_path: Original model path
            dtype: 'int8' or 'uint8'
            
        Returns:
            Path to quantized model
        """
        try:
            from onnxruntime.quantization import quantize_dynamic, QuantType
            
            quant_type = QuantType.QInt8 if dtype == 'int8' else QuantType.QUInt8
            output_path = self._get_output_path(original_path, dtype)
            
            quantize_dynamic(
                model_path=original_path,
                output_model_path=output_path,
                weight_type=quant_type,
                optimize_level=1
            )
            
            return output_path
        except ImportError:
            print("[COMPRESS] onnxruntime.quantization not available, skipping INT quantization")
            return original_path
    
    def _get_output_path(self, original_path: str, suffix: str) -> str:
        """Generate output path with suffix."""
        basename = os.path.basename(original_path)
        name, ext = os.path.splitext(basename)
        return os.path.join(self.output_dir, f"{name}_{suffix}{ext}")
    
    def get_model_size(self, model_path: str) -> Tuple[int, str]:
        """
        Get model size in human-readable format.
        
        Args:
            model_path: Path to model
            
        Returns:
            Tuple of (size_bytes, size_string)
        """
        size = os.path.getsize(model_path)
        
        if size < 1024:
            return size, f"{size} B"
        elif size < 1024 * 1024:
            return size, f"{size / 1024:.1f} KB"
        elif size < 1024 * 1024 * 1024:
            return size, f"{size / (1024 * 1024):.1f} MB"
        else:
            return size, f"{size / (1024 * 1024 * 1024):.2f} GB"


def compress_all_models(
    models_dir: str,
    output_dir: Optional[str] = None,
    quantization_type: str = 'fp16'
) -> dict:
    """
    Compress all models in a directory.
    
    Args:
        models_dir: Directory containing ONNX models
        output_dir: Output directory for compressed models
        quantization_type: Type of quantization ('fp16', 'int8', 'uint8')
        
    Returns:
        Dictionary of original_path -> compressed_path
    """
    compressor = ModelCompressor(output_dir)
    results = {}
    
    for filename in os.listdir(models_dir):
        if filename.endswith('.onnx'):
            input_path = os.path.join(models_dir, filename)
            try:
                compressed_path = compressor.quantize_model(
                    input_path,
                    quantization_type=quantization_type
                )
                results[input_path] = compressed_path
                
                # Report size reduction
                original_size = os.path.getsize(input_path)
                compressed_size = os.path.getsize(compressed_path)
                reduction = (1 - compressed_size / original_size) * 100
                
                print(f"[COMPRESS] {filename}: {original_size / 1024 / 1024:.1f}MB -> "
                      f"{compressed_size / 1024 / 1024:.1f}MB ({reduction:.1f}% reduction)")
            except Exception as e:
                print(f"[COMPRESS] Failed to compress {filename}: {e}")
                results[input_path] = input_path
    
    return results


class StreamingModelLoader:
    """
    Load large models in chunks for devices with limited memory.
    Optimized for NAND storage with sequential reads.
    """
    
    def __init__(self, chunk_size: int = 10 * 1024 * 1024):  # 10MB chunks
        """
        Initialize streaming loader.
        
        Args:
            chunk_size: Size of chunks to read at once
        """
        self.chunk_size = chunk_size
    
    def load_model_streaming(self, model_path: str) -> bytes:
        """
        Load model in streaming fashion.
        
        Args:
            model_path: Path to ONNX model
            
        Returns:
            Model bytes
        """
        chunks = []
        
        with open(model_path, 'rb') as f:
            while True:
                chunk = f.read(self.chunk_size)
                if not chunk:
                    break
                chunks.append(chunk)
        
        return b''.join(chunks)
    
    def estimate_loading_time(self, model_size: int) -> float:
        """
        Estimate time to load model from NAND storage.
        
        Args:
            model_size: Model size in bytes
            
        Returns:
            Estimated time in seconds
        """
        # NAND sequential read speed: ~200 MB/s typical
        nand_speed_mbps = 200
        return model_size / (nand_speed_mbps * 1024 * 1024)


def create_tflite_model(model_path: str, output_path: Optional[str] = None) -> str:
    """
    Convert ONNX model to TensorFlow Lite format.
    Useful for WebAssembly deployment.
    
    Args:
        model_path: Path to ONNX model
        output_path: Output path for TFLite model
        
    Returns:
        Path to TFLite model
    """
    try:
        import onnx
        from onnx_tf import backend
        
        # Load ONNX model
        onnx_model = onnx.load(model_path)
        
        # Convert to TensorFlow
        tf_rep = backend.prepare(onnx_model)
        
        if output_path is None:
            output_path = model_path.replace('.onnx', '.tflite')
        
        # Export to TFLite
        converter = tf.lite.TFLiteConverter.from_concrete_functions(
            tf_rep.signatures.values(),
            tf_rep
        )
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
        
        tflite_model = converter.convert()
        
        with open(output_path, 'wb') as f:
            f.write(tflite_model)
        
        return output_path
    except ImportError as e:
        print(f"[COMPRESS] TFLite conversion requires onnx-tf: {e}")
        raise
    except Exception as e:
        print(f"[COMPRESS] TFLite conversion failed: {e}")
        raise


def optimize_for_webassembly(model_path: str, output_dir: Optional[str] = None) -> str:
    """
    Optimize ONNX model for WebAssembly deployment.
    
    Args:
        model_path: Path to ONNX model
        output_dir: Output directory
        
    Returns:
        Path to optimized model
    """
    import onnx
    
    if output_dir is None:
        output_dir = os.path.dirname(model_path)
    
    # Load model
    model = onnx.load(model_path)
    
    # Apply WebAssembly-friendly optimizations
    from onnx import shape_inference
    
    # Infer shapes
    model = shape_inference.infer_shapes(model)
    
    # Remove unnecessary nodes and constants
    from onnx import optimizer
    
    passes = [
        'eliminate_deadend',
        'eliminate_nop_dropout',
        'eliminate_nop_cast',
        'eliminate_nop_monotone_argmax',
        'eliminate_nop_pad',
        'fuse_add_bias_into_conv',
        'fuse_bn_into_conv',
        'fuse_consecutive_squeeze',
        'fuse_consecutive_unsqueeze',
        'fuse_matmul_add_bias_into_gemm',
        'fuse_pad_into_conv',
        'fuse_transpose_into_gemm',
    ]
    
    model = optimizer.optimize(model, passes)
    
    # Save optimized model
    basename = os.path.basename(model_path)
    name, ext = os.path.splitext(basename)
    output_path = os.path.join(output_dir, f"{name}_wasm{ext}")
    
    onnx.save(model, output_path)
    
    return output_path


def get_model_info(model_path: str) -> dict:
    """
    Get information about an ONNX model.
    
    Args:
        model_path: Path to ONNX model
        
    Returns:
        Dictionary with model information
    """
    import onnx
    
    model = onnx.load(model_path)
    
    # Count parameters
    total_params = 0
    for initializer in model.graph.initializer:
        param_size = 1
        for dim in initializer.dims:
            param_size *= dim
        total_params += param_size
    
    # Get input/output shapes
    inputs = []
    for input_tensor in model.graph.input:
        shape = []
        for dim in input_tensor.type.tensor_type.shape.dim:
            if dim.dim_value:
                shape.append(dim.dim_value)
            else:
                shape.append('dynamic')
        inputs.append({
            'name': input_tensor.name,
            'shape': shape,
            'dtype': input_tensor.type.tensor_type.elem_type
        })
    
    outputs = []
    for output_tensor in model.graph.output:
        shape = []
        for dim in output_tensor.type.tensor_type.shape.dim:
            if dim.dim_value:
                shape.append(dim.dim_value)
            else:
                shape.append('dynamic')
        outputs.append({
            'name': output_tensor.name,
            'shape': shape,
            'dtype': output_tensor.type.tensor_type.elem_type
        })
    
    return {
        'path': model_path,
        'size': os.path.getsize(model_path),
        'ir_version': model.ir_version,
        'producer_name': model.producer_name,
        'inputs': inputs,
        'outputs': outputs,
        'total_parameters': total_params
    }
