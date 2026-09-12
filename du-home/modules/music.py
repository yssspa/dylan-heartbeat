import httpx
from fastapi import APIRouter, HTTPException
from config import MUSIC_API_URL

router = APIRouter(prefix="/api/music")


@router.get("/search")
async def search_song(keyword: str):
    if not keyword.strip():
        raise HTTPException(400, "关键词不能为空")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{MUSIC_API_URL}/search",
                params={"keywords": keyword, "limit": 20},
                timeout=10,
            )
            data = resp.json()
            songs = data.get("result", {}).get("songs", [])
            return [
                {
                    "id": s["id"],
                    "name": s["name"],
                    "artist": " / ".join(a["name"] for a in s.get("artists", [])),
                    "album": s.get("album", {}).get("name", ""),
                }
                for s in songs
            ]
    except Exception as e:
        raise HTTPException(500, f"搜索失败: {e}")


@router.get("/url")
async def get_song_url(id: int):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{MUSIC_API_URL}/song/url",
                params={"id": id},
                timeout=10,
            )
            data = resp.json()
            songs = data.get("data", [])
            if songs and songs[0].get("url"):
                return {"url": songs[0]["url"]}
            raise HTTPException(404, "无法获取播放链接")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"获取链接失败: {e}")
