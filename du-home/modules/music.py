from fastapi import APIRouter, HTTPException
from pyncm.apis.cloudsearch import GetSearchResult
from pyncm.apis.track import GetTrackAudio
from pyncm.apis.login import LoginViaAnonymousAccount

router = APIRouter(prefix="/api/music")

# pyncm 直连网易云（匿名会话）。搜歌与免费歌曲播放可用；
# 会员专享曲目可能取不到播放链接（之后可为本服务单独登录解锁）。
_session_ready = False


def _ensure_session():
    global _session_ready
    if not _session_ready:
        try:
            LoginViaAnonymousAccount()
        except Exception:
            # 匿名注册失败也继续尝试，搜索通常仍可用
            pass
        _session_ready = True


@router.get("/search")
def search_song(keyword: str):
    if not keyword.strip():
        raise HTTPException(400, "关键词不能为空")
    try:
        _ensure_session()
        data = GetSearchResult(keyword, limit=20)
        songs = (data.get("result") or {}).get("songs") or []
        return [
            {
                "id": s["id"],
                "name": s["name"],
                "artist": " / ".join(a.get("name", "") for a in (s.get("ar") or [])),
                "album": (s.get("al") or {}).get("name", ""),
            }
            for s in songs
        ]
    except Exception as e:
        raise HTTPException(500, f"搜索失败: {e}")


@router.get("/url")
def get_song_url(id: int):
    try:
        _ensure_session()
        data = GetTrackAudio([id], bitrate=320000)
        items = data.get("data") or []
        if items and items[0].get("url"):
            return {"url": items[0]["url"]}
        raise HTTPException(404, "无法获取播放链接（可能是会员专享）")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"获取链接失败: {e}")
