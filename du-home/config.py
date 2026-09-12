import os

# 对话引擎：cc / api
ENGINE = os.getenv("DU_ENGINE", "cc")

# cc_adapter 配置
CC_CMD = os.getenv("DU_CC_CMD", "claude")
PERSONA_PATH = os.path.join(os.path.dirname(__file__), "persona.md")

# api_adapter 配置（预留）
API_KEY = os.getenv("DU_API_KEY", "")
API_BASE_URL = os.getenv("DU_API_BASE_URL", "https://api.anthropic.com")
API_MODEL = os.getenv("DU_API_MODEL", "claude-opus-4-6")

# 历史注入条数
HISTORY_LIMIT = int(os.getenv("DU_HISTORY_LIMIT", "20"))

# 网易云音乐接口地址（你VPS上跑的那个）
MUSIC_API_URL = os.getenv("DU_MUSIC_API_URL", "http://localhost:3000")

# 服务端口
PORT = int(os.getenv("DU_PORT", "8900"))

# SQLite 路径
DB_PATH = os.path.join(os.path.dirname(__file__), "data.db")
