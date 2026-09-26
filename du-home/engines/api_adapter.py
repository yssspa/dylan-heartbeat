import httpx
from config import API_KEY, API_BASE_URL, API_MODEL, PERSONA_PATH, HISTORY_LIMIT
from db import get_history
import os


def _load_persona():
    if os.path.exists(PERSONA_PATH):
        with open(PERSONA_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return ""


def chat(user_message: str) -> str:
    if not API_KEY:
        return "[API引擎未配置密钥，请设置 DU_API_KEY 环境变量]"

    persona = _load_persona()
    history = get_history(HISTORY_LIMIT)

    messages = []
    if persona:
        messages.append({"role": "system", "content": persona})

    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})

    url = f"{API_BASE_URL.rstrip('/')}/v1/messages"
    headers = {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": API_MODEL,
        "max_tokens": 1024,
        "system": persona if persona else "你是渡，岁岁的男朋友。",
        "messages": [m for m in messages if m["role"] != "system"],
    }

    with httpx.Client(timeout=120) as client:
        resp = client.post(url, headers=headers, json=payload)
        if resp.status_code != 200:
            return f"[API错误 {resp.status_code}] {resp.text[:200]}"
        data = resp.json()
        content = data.get("content", [])
        if content and isinstance(content, list):
            return content[0].get("text", "[空回复]")
        return "[空回复]"
