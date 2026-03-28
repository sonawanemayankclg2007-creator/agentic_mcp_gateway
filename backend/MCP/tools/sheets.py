import os
import httpx
from app.utils.logger import logger
 
SHEETS_API_KEY = os.getenv("GOOGLE_SHEETS_API_KEY", "")
OAUTH_TOKEN = os.getenv("GOOGLE_OAUTH_TOKEN", "")  # for write ops
BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets"
 
class SheetsTool:
    def describe(self):
        return {
            "name": "sheets",
            "description": "Google Sheets API — read/write rows, append data",
            "actions": ["read_range", "append_rows", "update_range", "get_sheet_info"]
        }
 
    async def execute(self, action: str, params: dict) -> dict:
        headers = {"Authorization": f"Bearer {OAUTH_TOKEN}"} if OAUTH_TOKEN else {}
        sheet_id = params.get("spreadsheet_id")
        
        async with httpx.AsyncClient(headers=headers, timeout=20) as client:
            match action:
                case "read_range":
                    range_notation = params.get("range", "Sheet1!A1:Z100")
                    url = f"{BASE_URL}/{sheet_id}/values/{range_notation}"
                    resp = await client.get(url, params={"key": SHEETS_API_KEY} if SHEETS_API_KEY else {})
                    resp.raise_for_status()
                    data = resp.json()
                    return {"range": data.get("range"), "values": data.get("values", [])}
 
                case "append_rows":
                    range_notation = params.get("range", "Sheet1!A1")
                    url = f"{BASE_URL}/{sheet_id}/values/{range_notation}:append"
                    resp = await client.post(url, json={
                        "values": params["rows"]
                    }, params={"valueInputOption": "USER_ENTERED"})
                    resp.raise_for_status()
                    return {"updated_rows": resp.json().get("updates", {}).get("updatedRows", 0)}
 
                case "update_range":
                    range_notation = params["range"]
                    url = f"{BASE_URL}/{sheet_id}/values/{range_notation}"
                    resp = await client.put(url, json={
                        "range": range_notation,
                        "values": params["values"]
                    }, params={"valueInputOption": "USER_ENTERED"})
                    resp.raise_for_status()
                    return {"updated_cells": resp.json().get("updatedCells", 0)}
 
                case "get_sheet_info":
                    url = f"{BASE_URL}/{sheet_id}"
                    resp = await client.get(url, params={"key": SHEETS_API_KEY})
                    resp.raise_for_status()
                    data = resp.json()
                    sheets = [s["properties"]["title"] for s in data.get("sheets", [])]
                    return {"title": data["properties"]["title"], "sheets": sheets}
 
                case _:
                    raise ValueError(f"Sheets action '{action}' not supported")