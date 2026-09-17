# 岁月津渡前端包（给 Astra）

> 本文件为原始交接说明。2026-09-17 改版的使用方法、变更与测试边界请先看 `START-HERE.md`。当前 HTML 已使用相对素材路径，可直接打开作视觉预览。

这是当前正在运行的前端副本，只包含界面代码与必要图片素材；没有后端源码、人设文件、对话记录、支付配置、账号或密钥。

## 文件

- `static/index.html`：大厅、聊天、音乐三个界面的结构
- `static/style.css`：主要视觉、布局、响应式与动画
- `static/app.js`：页面切换、交互、Canvas 场景与接口调用
- `static/sw.js`、`static/manifest.json`、`static/harbor-icon.png`：PWA 文件
- `static/moon-gibbous-v2.png`、`static/moon-gibbous-v3.png`：月亮素材
- `static/morning-harbor-v1.png`：聊天页清晨渡口素材

## 当前方向

- 大厅：深夜海面、星空、月亮、小舟、渔灯、灯塔/渡口意象
- 聊天：清晨薄雾、水墨远山、小舟与白鹭；消息可读性优先
- 音乐：黄昏氛围，可继续深化

## 联调边界

当前页面由后端托管在 `/static/`，并调用这些同源接口：

- `POST /api/chat/send`
- `GET /api/chat/history`
- `GET /api/music/search?keyword=...`
- `GET /api/music/url?id=...`

美化时请尽量保留现有元素的 `id`、`data-*` 属性、页面切换逻辑和上述接口格式。不要把账号、密钥或支付信息写进前端。若要更换图片，建议仍使用本地素材路径，避免运行时依赖第三方图床。

单独打开 `index.html` 时，因为使用了 `/static/` 绝对路径和 `/api/` 接口，素材或联网功能可能不完整；在原后端的 `http://127.0.0.1:8900/static/index.html` 下预览最准确。
