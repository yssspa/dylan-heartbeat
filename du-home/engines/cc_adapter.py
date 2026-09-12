import subprocess
import os
from config import CC_CMD, PERSONA_PATH, HISTORY_LIMIT
from db import get_history


def _load_persona():
    if os.path.exists(PERSONA_PATH):
        with open(PERSONA_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return ""


def _build_prompt(user_message: str) -> str:
    persona = _load_persona()
    history = get_history(HISTORY_LIMIT)

    parts = []
    if persona:
        parts.append(f"<system>\n{persona}\n</system>")

    if history:
        parts.append("<conversation>")
        for msg in history:
            tag = "user" if msg["role"] == "user" else "assistant"
            parts.append(f"<{tag}>{msg['content']}</{tag}>")
        parts.append("</conversation>")

    parts.append(f"<user>{user_message}</user>")
    parts.append("请以渡的身份回复，不要加任何前缀标签。")

    return "\n".join(parts)


def chat(user_message: str) -> str:
    prompt = _build_prompt(user_message)
    result = subprocess.run(
        [CC_CMD, "-p", prompt],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        return f"[引擎错误] {result.stderr.strip()}"
    return result.stdout.strip()
