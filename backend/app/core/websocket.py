import json
from typing import Dict, List, Optional
from fastapi import WebSocket
from app.models.user import UserRoleEnum


class WebSocketManager:
    """Manages active WebSockets and role/user targeted broadcasts."""

    def __init__(self):
        # user_id -> list of active WebSocket connections
        self.active_user_connections: Dict[int, List[WebSocket]] = {}
        # role -> list of active WebSocket connections
        self.active_role_connections: Dict[UserRoleEnum, List[WebSocket]] = {
            UserRoleEnum.ADMIN: [],
            UserRoleEnum.STAFF: [],
            UserRoleEnum.CUSTOMER: [],
        }

    async def connect(self, websocket: WebSocket, user_id: int, role: UserRoleEnum):
        await websocket.accept()
        if user_id not in self.active_user_connections:
            self.active_user_connections[user_id] = []
        self.active_user_connections[user_id].append(websocket)
        
        if role in self.active_role_connections:
            self.active_role_connections[role].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int, role: UserRoleEnum):
        if user_id in self.active_user_connections:
            if websocket in self.active_user_connections[user_id]:
                self.active_user_connections[user_id].remove(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]
        
        if role in self.active_role_connections:
            if websocket in self.active_role_connections[role]:
                self.active_role_connections[role].remove(websocket)

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_user_connections:
            text_data = json.dumps(message)
            for connection in self.active_user_connections[user_id]:
                try:
                    await connection.send_text(text_data)
                except Exception:
                    pass

    async def broadcast_to_role(self, role: UserRoleEnum, message: dict):
        if role in self.active_role_connections:
            text_data = json.dumps(message)
            for connection in self.active_role_connections[role]:
                try:
                    await connection.send_text(text_data)
                except Exception:
                    pass

    async def broadcast(self, message: dict):
        text_data = json.dumps(message)
        for role_conns in self.active_role_connections.values():
            for conn in role_conns:
                try:
                    await conn.send_text(text_data)
                except Exception:
                    pass


ws_manager = WebSocketManager()
