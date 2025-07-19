from sqlalchemy.orm import Session
from backend.models import User, AuditLog
from backend.auth.hashing import get_password_hash
from datetime import datetime

def log_action(db: Session, user, action, target_type=None, target_id=None, details=None):
    log = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else None,
        action=action,
        target_type=target_type,
        target_id=target_id,
        timestamp=datetime.utcnow(),
        details=details
    )
    db.add(log)
    db.commit()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, username: str, password: str, role: str = 'user'):
    hashed_password = get_password_hash(password)
    user = User(username=username, hashed_password=hashed_password, role=role, is_approved=0)
    db.add(user)
    db.commit()
    db.refresh(user)
    log_action(db, user, 'register', target_type='user', target_id=user.id)
    return user

def get_unapproved_users(db: Session):
    return db.query(User).filter(User.is_approved == 0).all()

def approve_user(db: Session, user_id: int, admin_user=None):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_approved = 1
        db.commit()
        db.refresh(user)
        if admin_user:
            log_action(db, admin_user, 'approve_user', target_type='user', target_id=user.id)
    return user

def log_login(db: Session, user):
    log_action(db, user, 'login', target_type='user', target_id=user.id) 