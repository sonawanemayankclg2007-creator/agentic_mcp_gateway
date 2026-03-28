from typing import List, Dict
 
class MemoryStore:
    """Simple in-memory context store per session. Swap with Redis for production."""
 
    def __init__(self, max_history: int = 20):
        self._store: Dict[str, List[dict]] = {}
        self.max_history = max_history
 
    def get(self, session_id: str) -> List[dict]:
        return self._store.get(session_id, [])
 
    def append(self, session_id: str, message: dict):
        if session_id not in self._store:
            self._store[session_id] = []
        self._store[session_id].append(message)
        # Trim to max
        if len(self._store[session_id]) > self.max_history:
            self._store[session_id] = self._store[session_id][-self.max_history:]
 
    def clear(self, session_id: str):
        self._store.pop(session_id, None)
 
    def all_sessions(self) -> List[str]:
        return list(self._store.keys())