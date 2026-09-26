import httpx
from fastapi import APIRouter, HTTPException
from config import MUSIC_API_URL

router = APIRouter(prefix="/api/music")


@router.get("/search")
def search_song(keyword: str):
    if not keyword.strip():
        raise HTTPException(400, "关键词不能为空")
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(
                f"{MUSIC_API_URL}/cloudsearch",
                params={"keywords": keyword, "limit": 20},
            )
            resp.raise_for_status()
            data = resp.json()
        songs = (data.get("result") or {}).get("songs") or []
        return [
            {
                "id": s["id"],
                "name": s["name"],
                "artist": " / ".join(
                    a.get("name", "") for a in (s.get("ar") or [])
                ),
                "album": (s.get("al") or {}).get("name", ""),
            }
            for s in songs
        ]
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"音乐API返回错误: {e.response.status_code}")
    except httpx.RequestError:
        raise HTTPException(503, "音乐API不可达，请检查NeteaseCloudMusicApi服务")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"搜索失败: {e}")


@router.get("/url")
def get_song_url(id: int):
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(
                f"{MUSIC_API_URL}/song/url/v1",
                params={"id": id, "level": "higher"},
            )
            resp.raise_for_status()
            data = resp.json()
        items = data.get("data") or []
        if items and items[0].get("url"):
            return {"url": items[0]["url"]}
        raise HTTPException(404, "无法获取播放链接（可能是会员专享）")
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"音乐API返回错误: {e.response.status_code}")
    except httpx.RequestError:
        raise HTTPException(503, "音乐API不可达，请检查NeteaseCloudMusicApi服务")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"获取链接失败: {e}")
