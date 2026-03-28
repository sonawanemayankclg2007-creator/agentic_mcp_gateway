import os
import httpx
from app.utils.logger import logger
 
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
BASE_URL = "https://api.github.com"
 
HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
}
 
class GitHubTool:
    def describe(self):
        return {
            "name": "github",
            "description": "GitHub API integration — issues, PRs, commits, repos",
            "actions": ["create_issue", "list_issues", "create_pr", "list_prs", "get_repo", "add_comment"]
        }
 
    async def execute(self, action: str, params: dict) -> dict:
        async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
            match action:
                case "create_issue":
                    owner, repo = params["owner"], params["repo"]
                    resp = await client.post(f"{BASE_URL}/repos/{owner}/{repo}/issues", json={
                        "title": params["title"],
                        "body": params.get("body", ""),
                        "labels": params.get("labels", [])
                    })
                    resp.raise_for_status()
                    data = resp.json()
                    return {"issue_number": data["number"], "url": data["html_url"]}
 
                case "list_issues":
                    owner, repo = params["owner"], params["repo"]
                    resp = await client.get(f"{BASE_URL}/repos/{owner}/{repo}/issues",
                                            params={"state": params.get("state", "open")})
                    resp.raise_for_status()
                    issues = resp.json()
                    return {"issues": [{"number": i["number"], "title": i["title"], "state": i["state"]} for i in issues]}
 
                case "add_comment":
                    owner, repo, number = params["owner"], params["repo"], params["issue_number"]
                    resp = await client.post(f"{BASE_URL}/repos/{owner}/{repo}/issues/{number}/comments",
                                             json={"body": params["body"]})
                    resp.raise_for_status()
                    return {"comment_url": resp.json()["html_url"]}
 
                case "get_repo":
                    owner, repo = params["owner"], params["repo"]
                    resp = await client.get(f"{BASE_URL}/repos/{owner}/{repo}")
                    resp.raise_for_status()
                    d = resp.json()
                    return {"name": d["name"], "stars": d["stargazers_count"], "url": d["html_url"]}
 
                case _:
                    raise ValueError(f"GitHub action '{action}' not supported")
 