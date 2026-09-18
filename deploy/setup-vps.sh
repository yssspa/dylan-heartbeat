#!/bin/bash
# 岁月津渡 VPS 部署脚本
# 在 VPS 上以 dev 用户执行
# 用法: bash setup-vps.sh

set -e

REPO_URL="https://github.com/yssspa/dylan-heartbeat.git"
BRANCH="claude/inspiring-carson-w42itk"
INSTALL_DIR="/home/dev/dylan-heartbeat"
SERVICE_NAME="dylan-heartbeat"
PORT=8900

echo "=== 第1步：克隆仓库 ==="
if [ -d "$INSTALL_DIR" ]; then
    echo "目录已存在，拉取最新代码..."
    cd "$INSTALL_DIR"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    echo "克隆仓库..."
    git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo ""
echo "=== 第2步：创建 Python 虚拟环境 ==="
cd "$INSTALL_DIR/du-home"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo ""
echo "=== 第3步：创建环境配置 ==="
ENV_FILE="$INSTALL_DIR/du-home/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << 'ENVEOF'
# 引擎选择: cc 或 api
DU_ENGINE=api

# Claude Code CLI 路径（如果用 cc 引擎）
DU_CC_CMD=claude

# API 引擎配置（如果用 api 引擎）
DU_API_KEY=你的API密钥填这里
DU_API_BASE_URL=https://api.anthropic.com
DU_API_MODEL=claude-sonnet-4-20250514

# 历史消息条数
DU_HISTORY_LIMIT=20

# 网易云音乐 API 地址
DU_MUSIC_API_URL=http://localhost:3304

# 服务端口
DU_PORT=8900
ENVEOF
    echo "已创建 .env 文件，请编辑填入 API Key："
    echo "  nano $ENV_FILE"
else
    echo ".env 已存在，跳过"
fi

echo ""
echo "=== 第4步：创建 systemd 服务 ==="
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << SVCEOF
[Unit]
Description=岁月津渡 (Dylan Heartbeat)
After=network.target

[Service]
Type=simple
User=dev
WorkingDirectory=$INSTALL_DIR/du-home
EnvironmentFile=$INSTALL_DIR/du-home/.env
ExecStart=$INSTALL_DIR/du-home/venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port $PORT
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}

echo ""
echo "=== 第5步：显示 Caddy 配置片段（手动添加） ==="
echo ""
echo "请将以下内容添加到 Caddyfile 中 dusui.xyz 的配置里："
echo "（用 sudo nano /etc/caddy/Caddyfile 编辑）"
echo ""
cat << 'CADDYEOF'
# --- 岁月津渡 ---
# 在 Caddyfile 中添加以下独立站点块：
# home.dusui.xyz {
#     reverse_proxy 127.0.0.1:8900
# }
#
# 注意：不要修改 dusui.xyz 的现有配置
CADDYEOF

echo ""
echo "=== 部署准备完成 ==="
echo ""
echo "接下来手动操作："
echo "1. 编辑 .env 填入 API Key:  nano $ENV_FILE"
echo "2. 编辑 Caddyfile 添加路由:  sudo nano /etc/caddy/Caddyfile"
echo "3. 重载 Caddy:              sudo systemctl reload caddy"
echo "4. 启动服务:                 sudo systemctl start $SERVICE_NAME"
echo "5. 查看日志:                 sudo journalctl -u $SERVICE_NAME -f"
echo ""
