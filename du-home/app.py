import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from db import init_db
from modules.chat import router as chat_router
from modules.music import router as music_router
from config import PORT

app = FastAPI(title="岁月津渡")

app.include_router(chat_router)
app.include_router(music_router)

# 优先使用 frontend/static，退回 du-home/static
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "static")
if not os.path.isdir(frontend_dir):
    frontend_dir = os.path.join(os.path.dirname(__file__), "static")

app.mount("/static", StaticFiles(directory=frontend_dir), name="static")


@app.get("/")
async def index():
    return FileResponse(os.path.join(frontend_dir, "index.html"))


@app.on_event("startup")
async def startup():
    init_db()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=PORT)
