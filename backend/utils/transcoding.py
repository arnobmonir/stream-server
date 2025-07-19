import subprocess
import os

def transcode_media(input_path: str, output_path: str, bitrate: str = "800k", resolution: str = "640x360"):
    """Transcode video/audio to lower bitrate/resolution using ffmpeg."""
    cmd = [
        "ffmpeg", "-i", input_path,
        "-b:v", bitrate,
        "-s", resolution,
        "-y", output_path
    ]
    subprocess.run(cmd, check=True)

def convert_heic_to_jpeg(input_path: str, output_path: str):
    """Convert HEIC image to JPEG using pyheif and Pillow."""
    try:
        import pyheif
        from PIL import Image
        heif_file = pyheif.read(input_path)
        image = Image.frombytes(
            heif_file.mode, heif_file.size, heif_file.data,
            "raw", heif_file.mode, heif_file.stride, 1
        )
        image.save(output_path, format="JPEG")
    except ImportError:
        raise RuntimeError("pyheif and Pillow are required for HEIC conversion.") 