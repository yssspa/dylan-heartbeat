from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import save_message, get_history
from config import ENGINE

router = APIRouter(prefix="/api/chat")


class SendRequest(BaseModel):
    message: str


class SendResponse(BaseModel):
    reply: str
    engine: str


def _get_engine(name: str):
    if name == "cc":
        from engines.cc_adapter import chat
        return chat
    elif name == "api":
        from engines.api_adapter import chat
        return chat
    raise ValueError(f"Unknown engine: {name}")


@router.post("/send", response_model=SendResponse)
async def send_message(req: SendRequest):
    if not req.message.strip():
        raise HTTPException(400, "消息不能为空")

    save_message("user", req.message)

    used_engine = ENGINE
    try:
        chat_fn = _get_engine(ENGINE)
        reply = chat_fn(req.message)
    except Exception as e:
        if ENGINE == "cc":
            try:
                chat_fn = _get_engine("api")
                reply = chat_fn(req.message)
                used_engine = "api"
            except Exception as e2:
                raise HTTPException(500, f"双引擎均失败: CC={e}, API={e2}")
        else:
            raise HTTPException(500, f"引擎调用失败: {e}")

    if reply.startswith("[错误]") or reply.startswith("[引擎错误]") or reply.startswith("[超时]") or reply.startswith("[额度不足]"):
        if ENGINE == "cc":
            try:
                chat_fn = _get_engine("api")
                fallback_reply = chat_fn(req.message)
                if not fallback_reply.startswith("["):
                    reply = fallback_reply
                    used_engine = "api"
            except Exception:
                pass

    save_message("assistant", reply)
    return SendResponse(reply=reply, engine=used_engine)


@router.get("/history")
async def get_chat_history():
    return get_history(100)
