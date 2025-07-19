from sqlalchemy.orm import Session, joinedload
from backend.models import Media, Genre, Tag
from backend.crud.users import log_action

def create_media(db: Session, filename: str, filepath: str, genre: str, tags: list, uploader_id: int, user=None):
    # Handle genre
    genre_obj = None
    if genre:
        genre_obj = db.query(Genre).filter(Genre.name == genre).first()
        if not genre_obj:
            genre_obj = Genre(name=genre)
            db.add(genre_obj)
            db.commit()
            db.refresh(genre_obj)
    # Handle tags
    tag_objs = []
    for tag in tags:
        tag_obj = db.query(Tag).filter(Tag.name == tag).first()
        if not tag_obj:
            tag_obj = Tag(name=tag)
            db.add(tag_obj)
            db.commit()
            db.refresh(tag_obj)
        tag_objs.append(tag_obj)
    # Create media entry
    media = Media(
        filename=filename,
        filepath=filepath,
        genre=genre_obj,
        tags=tag_objs,
        uploader_id=uploader_id
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    if user:
        log_action(db, user, 'upload_media', target_type='media', target_id=media.id)
    return media

def get_media(db: Session, media_id: int):
    return db.query(Media).options(joinedload(Media.genre), joinedload(Media.tags)).filter(Media.id == media_id).first()

def list_media(db: Session):
    return db.query(Media).options(joinedload(Media.genre), joinedload(Media.tags)).all()

def delete_media(db: Session, media_id: int, current_user):
    if current_user.role != 'admin':
        return False
    media = db.query(Media).filter(Media.id == media_id).first()
    if media:
        db.delete(media)
        db.commit()
        log_action(db, current_user, 'delete_media', target_type='media', target_id=media_id)
        return True
    return False

def update_media(db: Session, media_id: int, data: dict, current_user):
    if current_user.role != 'admin':
        return None
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        return None
    for key, value in data.items():
        setattr(media, key, value)
    db.commit()
    db.refresh(media)
    log_action(db, current_user, 'edit_media', target_type='media', target_id=media_id)
    return media 