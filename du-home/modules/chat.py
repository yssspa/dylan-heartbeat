from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from engines import chat as engine_chat
from db import save_message, get_history

router = APIRouter(prefix="/api/chat")


class SendRequest(BaseModel):
    message: str


class SendResponse(BaseModel):
    reply: str


@router.post("/send", response_model=SendResponse)
async def send_message(req: SendRequest):
    if not req.message.strip():
        raise HTTPException(400, "消息不能为空")

    save_message("user", req.message)

    try:
        reply = engine_chat(req.message)
    except Exception as e:
        raise HTTPException(500, f"引擎调用失败: {e}")

    save_message("assistant", reply)
    return SendResponse(reply=reply)


@router.get("/history")
async def get_chat_history():
    return get_history(100)
