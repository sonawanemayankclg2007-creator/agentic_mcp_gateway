import os
import httpx
from app.utils.logger import get_logger
from app.utils.retry import retry

logger = get_logger("mcp.jira")


def _base() -> str:
    return os.getenv("JIRA_URL", "").rstrip("/")


def _auth() -> tuple:
    return (os.getenv("JIRA_EMAIL", ""), os.getenv("JIRA_TOKEN", ""))


def _headers() -> dict:
    return {"Accept": "application/json", "Content-Type": "application/json"}


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def create_ticket(project: str, summary: str, description: str, priority: str) -> dict:
    url = f"{_base()}/rest/api/3/issue"
    payload = {
        "fields": {
            "project": {"key": project},
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": description}]}],
            },
            "issuetype": {"name": "Task"},
            "priority": {"name": priority},
        }
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, headers=_headers(), json=payload, auth=_auth())
        resp.raise_for_status()
        data = resp.json()
        logger.info("create_ticket success", extra={"project": project, "key": data.get("key")})
        return {"success": True, "result": data}


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def set_priority(ticket_id: str, priority: str) -> dict:
    url = f"{_base()}/rest/api/3/issue/{ticket_id}"
    payload = {"fields": {"priority": {"name": priority}}}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.put(url, headers=_headers(), json=payload, auth=_auth())
        resp.raise_for_status()
        logger.info("set_priority success", extra={"ticket": ticket_id, "priority": priority})
        return {"success": True, "result": {"ticket_id": ticket_id, "priority": priority}}


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def link_issue(ticket_id: str, github_url: str) -> dict:
    url = f"{_base()}/rest/api/3/issue/{ticket_id}/remotelink"
    payload = {
        "object": {
            "url": github_url,
            "title": "GitHub Issue",
            "icon": {"url16x16": "https://github.com/favicon.ico"},
        }
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, headers=_headers(), json=payload, auth=_auth())
        resp.raise_for_status()
        data = resp.json()
        logger.info("link_issue success", extra={"ticket": ticket_id})
        return {"success": True, "result": data}


async def dispatch(action: str, params: dict) -> dict:
    try:
        if action == "create_ticket":
            return await create_ticket(
                params.get("project", "OPS"),
                params.get("summary", "Agent-created ticket"),
                params.get("description", ""),
                params.get("priority", "Medium"),
            )
        elif action == "set_priority":
            return await set_priority(params["ticket_id"], params.get("priority", "Medium"))
        elif action == "link_issue":
            return await link_issue(params["ticket_id"], params["github_url"])
        else:
            return {"success": False, "error": f"Unknown jira action: {action}"}
    except httpx.HTTPStatusError as exc:
        logger.error("Jira HTTP error", extra={"status": exc.response.status_code, "action": action})
        return {"success": False, "error": f"Jira API error {exc.response.status_code}: {exc.response.text[:200]}"}
    except Exception as exc:
        logger.error("Jira error", extra={"error": str(exc), "action": action})
        return {"success": False, "error": str(exc)}
