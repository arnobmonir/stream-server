from pydantic import BaseModel
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class MediaOut(BaseModel):
    id: int
    filename: str
    filepath: str
    genre: Optional[str] = None
    tags: List[str] = []
    class Config:
        orm_mode = True 