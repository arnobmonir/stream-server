from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, BackgroundTasks, Body, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from backend.schemas import MediaOut
from backend.crud.media import create_media, get_media, list_media, delete_media, update_media
from backend.auth.dependencies import get_db, get_current_user
from backend.utils.transcoding import transcode_to_hls
import subprocess

MEDIA_ROOT = os.getenv("MEDIA_ROOT", "media")

router = APIRouter()

@router.get("/media", response_model=List[MediaOut])
def api_list_media(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    media_files = list_media(db)
    return [MediaOut(
        id=m.id,
        filename=m.filename,
        filepath=m.filepath,
        genre=m.genre.name if m.genre else None,
        tags=[t.name for t in m.tags]
    ) for m in media_files]

@router.post("/media/upload", response_model=MediaOut)
def api_upload_media(
    file: UploadFile = File(...),
    genre: str = None,
    tags: List[str] = [],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    save_path = os.path.join(MEDIA_ROOT, file.filename)
    with open(save_path, "wb") as f:
        f.write(file.file.read())
    media = create_media(db, file.filename, save_path, genre, tags, current_user.id, user=current_user)
    # Automatically transcode to HLS in the background if video
    ext = os.path.splitext(file.filename)[1].lower()
    if ext in [".mp4", ".mkv", ".mov"] and background_tasks is not None:
        hls_dir = os.path.join(MEDIA_ROOT, f"hls_{media.id}")
        background_tasks.add_task(transcode_to_hls, save_path, hls_dir)
    return MediaOut(
        id=media.id,
        filename=media.filename,
        filepath=media.filepath,
        genre=media.genre.name if media.genre else None,
        tags=[t.name for t in media.tags]
    )

@router.post("/media/download")
def download_video(
    url: str = Body(...),
    genre: str = Body(None),
    tags: List[str] = Body([]),
    quality: str = Body("best"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    # Use yt-dlp to download the video
    # Save to MEDIA_ROOT, get the filename
    os.makedirs(MEDIA_ROOT, exist_ok=True)
    cmd = [
        "yt-dlp",
        "-f", quality,
        "-o", os.path.join(MEDIA_ROOT, "%(title)s.%(ext)s"),
        url
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"yt-dlp failed: {result.stderr}")
    # Find the downloaded file (yt-dlp prints the filename)
    # We'll look for the newest file in MEDIA_ROOT
    files = [os.path.join(MEDIA_ROOT, f) for f in os.listdir(MEDIA_ROOT)]
    latest_file = max(files, key=os.path.getctime)
    filename = os.path.basename(latest_file)
    # Add to DB
    media = create_media(db, filename, latest_file, genre, tags, current_user.id, user=current_user)
    # Trigger HLS transcoding if video
    ext = os.path.splitext(filename)[1].lower()
    if ext in [".mp4", ".mkv", ".mov"] and background_tasks is not None:
        hls_dir = os.path.join(MEDIA_ROOT, f"hls_{media.id}")
        background_tasks.add_task(transcode_to_hls, latest_file, hls_dir)
    return {"detail": "Download started and media added!"}

@router.api_route("/media/hls/{media_id}/{filename}", methods=["GET", "HEAD"])
def serve_hls(media_id: int, filename: str, db: Session = Depends(get_db), request: Request = None):
    hls_dir = os.path.join(MEDIA_ROOT, f"hls_{media_id}")
    file_path = os.path.join(hls_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="HLS file not found")
    if request and request.method == "HEAD":
        return Response(status_code=200)
    return FileResponse(file_path)

@router.post("/media/hls/{media_id}/trigger")
def trigger_hls(media_id: int, db: Session = Depends(get_db), background_tasks: BackgroundTasks = None):
    media = get_media(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    ext = os.path.splitext(media.filename)[1].lower()
    if ext not in [".mp4", ".mkv", ".mov"]:
        return {"detail": "Not a video file"}
    hls_dir = os.path.join(MEDIA_ROOT, f"hls_{media_id}")
    playlist_path = os.path.join(hls_dir, "playlist.m3u8")
    if os.path.exists(playlist_path):
        return {"detail": "HLS already exists"}
    if background_tasks is not None:
        background_tasks.add_task(transcode_to_hls, media.filepath, hls_dir)
        return {"detail": "HLS transcoding started"}
    # Fallback: run synchronously (should not happen in normal API usage)
    transcode_to_hls(media.filepath, hls_dir)
    return {"detail": "HLS transcoding started (sync)"}

@router.get("/media/stream/{media_id}")
def api_stream_media(
    media_id: int,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user),  # Removed authentication for streaming
    quality: Optional[str] = Query(None, description="Set to 'low' for low-bitrate streaming"),
    background_tasks: BackgroundTasks = None
):
    media = get_media(db, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    ext = os.path.splitext(media.filename)[1].lower()
    # Transcode video/audio on the fly if requested
    if quality == "low" and ext in [".mp4", ".mkv", ".mov", ".mp3", ".aac", ".flac"]:
        low_path = media.filepath + ".low.mp4" if ext in [".mp4", ".mkv", ".mov"] else media.filepath + ".low.mp3"
        if not os.path.exists(low_path):
            def do_transcode():
                try:
                    if ext in [".mp4", ".mkv", ".mov"]:
                        transcode_media(media.filepath, low_path, bitrate="500k", resolution="426x240")
                    else:
                        transcode_media(media.filepath, low_path, bitrate="64k")
                except Exception as e:
                    # Optionally log error
                    pass
            if background_tasks is not None:
                background_tasks.add_task(do_transcode)
            return JSONResponse(status_code=202, content={"detail": "Transcoding in progress. Please retry after a moment."})
        return FileResponse(low_path, filename=os.path.basename(low_path))
    return FileResponse(media.filepath, filename=media.filename)

@router.delete("/media/{media_id}")
def api_delete_media(media_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    success = delete_media(db, media_id, current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"detail": "Media deleted"}

@router.put("/media/{media_id}")
def api_update_media(media_id: int, data: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    media = update_media(db, media_id, data, current_user)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return MediaOut(
        id=media.id,
        filename=media.filename,
        filepath=media.filepath,
        genre=media.genre.name if media.genre else None,
        tags=[t.name for t in media.tags]
    )

@router.get("/media/stat/{media_id}")
def media_stat(media_id: int, db: Session = Depends(get_db)):
    media = get_media(db, media_id)
    if not media or not os.path.exists(media.filepath):
        raise HTTPException(status_code=404, detail="Media not found")
    stat = os.stat(media.filepath)
    return JSONResponse({
        "size": stat.st_size,
        "mtime": stat.st_mtime
    }) 