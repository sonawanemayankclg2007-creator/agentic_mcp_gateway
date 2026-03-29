from app.mcp.tools import github, slack, jira, sheets
from app.utils.logger import logger
 
TOOL_MAP = {
    "github": github.GitHubTool(),
    "slack": slack.SlackTool(),
    "jira": jira.JiraTool(),
    "sheets": sheets.SheetsTool(),
}
 
class MCPGateway:
    """Routes tool calls to the correct MCP-compatible integration."""
 
    async def call_tool(self, tool: str, action: str, params: dict) -> dict:
        handler = TOOL_MAP.get(tool.lower())
        if not handler:
            raise ValueError(f"Unknown tool: {tool}. Available: {list(TOOL_MAP.keys())}")
        
        logger.info(f"MCP Gateway → {tool}.{action} | params={params}")
        result = await handler.execute(action, params)
        logger.info(f"MCP Gateway ← {tool}.{action} | success")
        return result
 
    def list_tools(self):
        return {name: tool.describe() for name, tool in TOOL_MAP.items()}