from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from backend.schemas import MediaOut
from backend.crud.media import create_media, get_media, list_media, delete_media, update_media
from backend.auth.dependencies import get_db, get_current_user

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
    current_user = Depends(get_current_user)
):
    save_path = os.path.join(MEDIA_ROOT, file.filename)
    with open(save_path, "wb") as f:
        f.write(file.file.read())
    media = create_media(db, file.filename, save_path, genre, tags, current_user.id, user=current_user)
    return MediaOut(
        id=media.id,
        filename=media.filename,
        filepath=media.filepath,
        genre=media.genre.name if media.genre else None,
        tags=[t.name for t in media.tags]
    )

@router.get("/media/stream/{media_id}")
def api_stream_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
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