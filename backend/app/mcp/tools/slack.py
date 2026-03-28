import os
import httpx
from app.utils.logger import get_logger
from app.utils.retry import retry

logger = get_logger("mcp.slack")
BASE = "https://slack.com/api"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.getenv('SLACK_BOT_TOKEN', '')}",
        "Content-Type": "application/json",
    }


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def post_message(channel: str, text: str, attachments: list = None) -> dict:
    payload = {"channel": channel, "text": text}
    if attachments:
        payload["attachments"] = attachments
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(f"{BASE}/chat.postMessage", headers=_headers(), json=payload)
        resp.raise_for_status()
        data = resp.json()
        if not data.get("ok"):
            raise RuntimeError(f"Slack error: {data.get('error', 'unknown')}")
        logger.info("post_message success", extra={"channel": channel})
        return {"success": True, "result": data}


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def tag_user(channel: str, user_id: str, message: str) -> dict:
    text = f"<@{user_id}> {message}"
    return await post_message(channel, text)


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def get_channel_id(channel_name: str) -> dict:
    clean_name = channel_name.lstrip("#")
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{BASE}/conversations.list",
            headers=_headers(),
            params={"limit": 200, "types": "public_channel,private_channel"},
        )
        resp.raise_for_status()
        data = resp.json()
        if not data.get("ok"):
            raise RuntimeError(f"Slack error: {data.get('error', 'unknown')}")
        for ch in data.get("channels", []):
            if ch["name"] == clean_name:
                logger.info("get_channel_id success", extra={"channel": clean_name, "id": ch["id"]})
                return {"success": True, "result": {"channel_id": ch["id"], "name": clean_name}}
        return {"success": False, "error": f"Channel '{clean_name}' not found"}


async def dispatch(action: str, params: dict) -> dict:
    try:
        if action == "post_message":
            return await post_message(
                params.get("channel", "#general"),
                params.get("text", ""),
                params.get("attachments", []),
            )
        elif action == "tag_user":
            return await tag_user(
                params.get("channel", "#general"),
                params.get("user_id", ""),
                params.get("message", ""),
            )
        elif action == "get_channel_id":
            return await get_channel_id(params.get("channel_name", "general"))
        else:
            return {"success": False, "error": f"Unknown slack action: {action}"}
    except httpx.HTTPStatusError as exc:
        logger.error("Slack HTTP error", extra={"status": exc.response.status_code, "action": action})
        return {"success": False, "error": f"Slack API error {exc.response.status_code}: {exc.response.text[:200]}"}
    except Exception as exc:
        logger.error("Slack error", extra={"error": str(exc), "action": action})
        return {"success": False, "error": str(exc)}
