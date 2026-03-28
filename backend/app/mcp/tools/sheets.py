import os
import httpx
from app.utils.logger import get_logger
from app.utils.retry import retry

logger = get_logger("mcp.sheets")
BASE = "https://sheets.googleapis.com/v4/spreadsheets"


def _key() -> str:
    return os.getenv("GOOGLE_SHEETS_KEY", "")


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def read_range(sheet_id: str, range_: str) -> dict:
    url = f"{BASE}/{sheet_id}/values/{range_}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params={"key": _key()})
        resp.raise_for_status()
        data = resp.json()
        rows = data.get("values", [])
        logger.info("read_range success", extra={"sheet_id": sheet_id, "range": range_, "rows": len(rows)})
        return {"success": True, "result": rows}


@retry(max_attempts=3, delay=1.0, backoff=2.0)
async def append_row(sheet_id: str, range_: str, values: list) -> dict:
    url = f"{BASE}/{sheet_id}/values/{range_}:append"
    payload = {"values": [values]}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            url,
            params={"key": _key(), "valueInputOption": "USER_ENTERED", "insertDataOption": "INSERT_ROWS"},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info("append_row success", extra={"sheet_id": sheet_id, "range": range_})
        return {"success": True, "result": data}


async def dispatch(action: str, params: dict) -> dict:
    try:
        if action == "read_range":
            return await read_range(params["sheet_id"], params.get("range", "Sheet1!A1:Z100"))
        elif action == "append_row":
            return await append_row(
                params["sheet_id"],
                params.get("range", "Sheet1!A1"),
                params.get("values", []),
            )
        else:
            return {"success": False, "error": f"Unknown sheets action: {action}"}
    except httpx.HTTPStatusError as exc:
        logger.error("Sheets HTTP error", extra={"status": exc.response.status_code, "action": action})
        return {"success": False, "error": f"Sheets API error {exc.response.status_code}: {exc.response.text[:200]}"}
    except Exception as exc:
        logger.error("Sheets error", extra={"error": str(exc), "action": action})
        return {"success": False, "error": str(exc)}
