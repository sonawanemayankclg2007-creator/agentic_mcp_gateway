import asyncio
from typing import Any

# session_id -> { dag, step_results, approval_status, events_queue, ... }
_store: dict[str, dict[str, Any]] = {}


def _ensure_session(session_id: str) -> None:
    if session_id not in _store:
        _store[session_id] = {
            "dag": None,
            "step_results": {},
            "approval_status": {},   # step_id -> True|False|None (None = pending)
            "events_queue": asyncio.Queue(),
        }


def store(session_id: str, key: str, value: Any) -> None:
    _ensure_session(session_id)
    _store[session_id][key] = value


def get(session_id: str, key: str) -> Any:
    _ensure_session(session_id)
    return _store[session_id].get(key)


def get_session(session_id: str) -> dict:
    _ensure_session(session_id)
    return _store[session_id]


def clear(session_id: str) -> None:
    _store.pop(session_id, None)


def get_events_queue(session_id: str) -> asyncio.Queue:
    _ensure_session(session_id)
    return _store[session_id]["events_queue"]


def all_session_ids() -> list[str]:
    return list(_store.keys())
