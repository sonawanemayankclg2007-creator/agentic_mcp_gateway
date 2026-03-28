from app.mcp.tools import github, jira, slack, sheets
from app.utils.logger import get_logger

logger = get_logger("mcp.gateway")

_DISPATCH = {
    "github": github.dispatch,
    "jira": jira.dispatch,
    "slack": slack.dispatch,
    "sheets": sheets.dispatch,
}


async def execute_tool(tool: str, action: str, params: dict) -> dict:
    """
    Routes to the correct MCP tool module.
    Returns { success: bool, result: dict, error: str|None }
    """
    tool_lower = tool.lower()

    if tool_lower == "none" or not tool_lower:
        logger.info("No-op tool step", extra={"action": action})
        return {"success": True, "result": {"note": "no-op step"}, "error": None}

    dispatcher = _DISPATCH.get(tool_lower)
    if not dispatcher:
        logger.warning("Unknown tool requested", extra={"tool": tool})
        return {"success": False, "result": {}, "error": f"Unknown tool: {tool}"}

    logger.info("Dispatching tool", extra={"tool": tool_lower, "action": action})
    result = await dispatcher(action, params)

    # Normalise — ensure all three keys always present
    result.setdefault("error", None)
    result.setdefault("result", {})
    return result
