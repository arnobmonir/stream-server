import os
from fastapi import UploadFile

def ensure_media_root(media_root: str):
    os.makedirs(media_root, exist_ok=True)

def save_upload_file(upload_file: UploadFile, destination: str):
    with open(destination, "wb") as buffer:
        buffer.write(upload_file.file.read()) 