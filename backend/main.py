from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import users, media

app = FastAPI()

# CORS setup for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(media.router) 