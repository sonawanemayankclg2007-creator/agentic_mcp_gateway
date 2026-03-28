import os
import httpx
from app.utils.logger import get_logger
from app.utils.retry import retry

logger = get_logger("mcp.github")
BASE = "https://api.github.com"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.getenv('GITHUB_TOKEN', '')}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def read_issue(repo: str, issue_number: int) -> dict:
    url = f"{BASE}/repos/{repo}/issues/{issue_number}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, headers=_headers())
        resp.raise_for_status()
        data = resp.json()
        logger.info("read_issue success", extra={"repo": repo, "issue": issue_number})
        return {"success": True, "result": data}


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def add_label(repo: str, issue_number: int, labels: list) -> dict:
    url = f"{BASE}/repos/{repo}/issues/{issue_number}/labels"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, headers=_headers(), json={"labels": labels})
        resp.raise_for_status()
        data = resp.json()
        logger.info("add_label success", extra={"repo": repo, "issue": issue_number, "labels": labels})
        return {"success": True, "result": data}


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def post_comment(repo: str, issue_number: int, body: str) -> dict:
    url = f"{BASE}/repos/{repo}/issues/{issue_number}/comments"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, headers=_headers(), json={"body": body})
        resp.raise_for_status()
        data = resp.json()
        logger.info("post_comment success", extra={"repo": repo, "issue": issue_number})
        return {"success": True, "result": data}


async def dispatch(action: str, params: dict) -> dict:
    try:
        if action == "read_issue":
            return await read_issue(params["repo"], int(params["issue_number"]))
        elif action == "add_label":
            return await add_label(params["repo"], int(params["issue_number"]), params.get("labels", []))
        elif action == "post_comment":
            return await post_comment(params["repo"], int(params["issue_number"]), params["body"])
        else:
            return {"success": False, "error": f"Unknown github action: {action}"}
    except httpx.HTTPStatusError as exc:
        logger.error("GitHub HTTP error", extra={"status": exc.response.status_code, "action": action})
        return {"success": False, "error": f"GitHub API error {exc.response.status_code}: {exc.response.text[:200]}"}
    except Exception as exc:
        logger.error("GitHub error", extra={"error": str(exc), "action": action})
        return {"success": False, "error": str(exc)}
