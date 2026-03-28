import os
import httpx
import base64
from app.utils.logger import logger
 
JIRA_EMAIL = os.getenv("JIRA_EMAIL", "")
JIRA_TOKEN = os.getenv("JIRA_API_TOKEN", "")
JIRA_DOMAIN = os.getenv("JIRA_DOMAIN", "")  # e.g. yourorg.atlassian.net
 
auth = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_TOKEN}".encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}
 
class JiraTool:
    def describe(self):
        return {
            "name": "jira",
            "description": "Jira Cloud — create/update/query issues and sprints",
            "actions": ["create_issue", "get_issue", "update_issue", "search_issues", "add_comment"]
        }
 
    async def execute(self, action: str, params: dict) -> dict:
        base = f"https://{JIRA_DOMAIN}/rest/api/3"
        async with httpx.AsyncClient(headers=HEADERS, timeout=20) as client:
            match action:
                case "create_issue":
                    payload = {
                        "fields": {
                            "project": {"key": params["project_key"]},
                            "summary": params["summary"],
                            "description": {
                                "type": "doc", "version": 1,
                                "content": [{"type": "paragraph", "content": [{"type": "text", "text": params.get("description", "")}]}]
                            },
                            "issuetype": {"name": params.get("issue_type", "Task")},
                            "priority": {"name": params.get("priority", "Medium")}
                        }
                    }
                    resp = await client.post(f"{base}/issue", json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    return {"issue_key": data["key"], "id": data["id"]}
 
                case "get_issue":
                    resp = await client.get(f"{base}/issue/{params['issue_key']}")
                    resp.raise_for_status()
                    d = resp.json()
                    return {"key": d["key"], "summary": d["fields"]["summary"], "status": d["fields"]["status"]["name"]}
 
                case "update_issue":
                    resp = await client.put(f"{base}/issue/{params['issue_key']}", json={
                        "fields": params.get("fields", {})
                    })
                    resp.raise_for_status()
                    return {"updated": params["issue_key"]}
 
                case "search_issues":
                    resp = await client.post(f"{base}/issue/picker", json={
                        "jql": params.get("jql", "project IS NOT EMPTY"),
                        "maxResults": params.get("max", 10)
                    })
                    resp.raise_for_status()
                    return resp.json()
 
                case "add_comment":
                    payload = {
                        "body": {
                            "type": "doc", "version": 1,
                            "content": [{"type": "paragraph", "content": [{"type": "text", "text": params["comment"]}]}]
                        }
                    }
                    resp = await client.post(f"{base}/issue/{params['issue_key']}/comment", json=payload)
                    resp.raise_for_status()
                    return {"comment_id": resp.json()["id"]}
 
                case _:
                    raise ValueError(f"Jira action '{action}' not supported")