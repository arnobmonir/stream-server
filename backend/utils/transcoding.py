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


def transcode_to_hls(input_path: str, output_dir: str, playlist_name: str = "playlist.m3u8", bitrate: str = "500k", resolution: str = "426x240"):
    """Transcode a video to HLS (m3u8 + ts segments) using ffmpeg."""
    os.makedirs(output_dir, exist_ok=True)
    playlist_path = os.path.join(output_dir, playlist_name)
    cmd = [
        "ffmpeg", "-i", input_path,
        "-vf", f"scale={resolution}",
        "-c:v", "libx264",
        "-b:v", bitrate,
        "-c:a", "aac",
        "-hls_time", "4",
        "-hls_playlist_type", "vod",
        "-hls_segment_filename", os.path.join(output_dir, "segment_%03d.ts"),
        "-y", playlist_path
    ]
    subprocess.run(cmd, check=True)
    return playlist_path 