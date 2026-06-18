import asyncio
from typing import Dict, List, Set
import json

class SSEManager:
    def __init__(self):
        # Maps technician_id to a list of asyncio.Queue (since one tech might have multiple connections)
        self.active_connections: Dict[str, List[asyncio.Queue]] = {}

    def connect(self, technician_id: str) -> asyncio.Queue:
        if technician_id not in self.active_connections:
            self.active_connections[technician_id] = []
        q = asyncio.Queue()
        self.active_connections[technician_id].append(q)
        return q

    def disconnect(self, technician_id: str, q: asyncio.Queue):
        if technician_id in self.active_connections:
            try:
                self.active_connections[technician_id].remove(q)
            except ValueError:
                pass
            if not self.active_connections[technician_id]:
                del self.active_connections[technician_id]

    async def notify_technicians(self, technician_ids: List[str], event_name: str, payload: dict):
        data = f"event: {event_name}\ndata: {json.dumps(payload)}\n\n"
        for tech_id in technician_ids:
            if tech_id in self.active_connections:
                for q in self.active_connections[tech_id]:
                    await q.put(data)

# Global singleton
manager = SSEManager()
