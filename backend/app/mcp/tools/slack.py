import os
import httpx
from app.utils.logger import logger
 
SLACK_TOKEN = os.getenv("SLACK_BOT_TOKEN", "")
BASE_URL = "https://slack.com/api"
HEADERS = {"Authorization": f"Bearer {SLACK_TOKEN}", "Content-Type": "application/json"}
 
class SlackTool:
    def describe(self):
        return {
            "name": "slack",
            "description": "Slack API — send messages, DMs, list channels",
            "actions": ["send_message", "send_dm", "list_channels", "get_channel_history"]
        }
 
    async def execute(self, action: str, params: dict) -> dict:
        async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
            match action:
                case "send_message":
                    resp = await client.post(f"{BASE_URL}/chat.postMessage", json={
                        "channel": params["channel"],
                        "text": params["text"],
                        "blocks": params.get("blocks", [])
                    })
                    data = resp.json()
                    if not data.get("ok"):
                        raise RuntimeError(f"Slack error: {data.get('error')}")
                    return {"ts": data["ts"], "channel": data["channel"]}
 
                case "send_dm":
                    # Open DM then send
                    open_resp = await client.post(f"{BASE_URL}/conversations.open",
                                                   json={"users": params["user_id"]})
                    channel_id = open_resp.json()["channel"]["id"]
                    resp = await client.post(f"{BASE_URL}/chat.postMessage", json={
                        "channel": channel_id,
                        "text": params["text"]
                    })
                    data = resp.json()
                    return {"ts": data.get("ts"), "dm_channel": channel_id}
 
                case "list_channels":
                    resp = await client.get(f"{BASE_URL}/conversations.list")
                    data = resp.json()
                    channels = data.get("channels", [])
                    return {"channels": [{"id": c["id"], "name": c["name"]} for c in channels]}
 
                case "get_channel_history":
                    resp = await client.get(f"{BASE_URL}/conversations.history", params={
                        "channel": params["channel"],
                        "limit": params.get("limit", 10)
                    })
                    data = resp.json()
                    return {"messages": [{"text": m.get("text"), "ts": m.get("ts")} for m in data.get("messages", [])]}
 
                case _:
                    raise ValueError(f"Slack action '{action}' not supported")