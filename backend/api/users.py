from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.schemas import UserCreate, Token
from backend.crud.users import get_user_by_username, create_user, get_unapproved_users, approve_user, log_login
from backend.auth.jwt import create_access_token
from backend.auth.dependencies import get_db, get_current_user
from backend.models import AuditLog

router = APIRouter()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    create_user(db, user.username, user.password)
    return {"detail": "Registration successful! Your account is pending admin approval."}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_username(db, form_data.username)
    from backend.auth.hashing import verify_password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Account not approved. Please wait for admin approval.")
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    log_login(db, user)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user = Depends(get_current_user)):
    return {"username": current_user.username, "role": current_user.role}

# --- Admin Endpoints ---
@router.get("/admin/users/unapproved")
def list_unapproved_users(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    users = get_unapproved_users(db)
    return [{"id": u.id, "username": u.username} for u in users]

@router.post("/admin/users/approve/{user_id}")
def approve_user_endpoint(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    user = approve_user(db, user_id, admin_user=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": f"User {user.username} approved."}

@router.get("/admin/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    user: str = Query(None),
    action: str = Query(None),
    target_type: str = Query(None)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    q = db.query(AuditLog)
    if user:
        q = q.filter(AuditLog.username == user)
    if action:
        q = q.filter(AuditLog.action == action)
    if target_type:
        q = q.filter(AuditLog.target_type == target_type)
    logs = q.order_by(AuditLog.timestamp.desc()).limit(200).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": log.username,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "timestamp": log.timestamp,
            "details": log.details
        }
        for log in logs
    ] 