import { store } from '../store';
import { addNotification, showToast } from '../store/uiSlice';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectTimeout = null;
    this.reconnectDelay = 2000;
  }

  connect(token) {
    if (!token) return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications?token=${token}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectDelay = 2000;
        // Ping every 30s to keep alive
        this.pingInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send('ping');
          }
        }, 30000);
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NOTIFICATION') {
            store.dispatch(addNotification(payload.data));
            store.dispatch(
              showToast({
                message: `${payload.data.title}: ${payload.data.message}`,
                type: 'info',
              })
            );
          }
        } catch (e) {
          // pong or other raw messages
        }
      };

      this.socket.onclose = () => {
        clearInterval(this.pingInterval);
        this.scheduleReconnect(token);
      };

      this.socket.onerror = () => {
        if (this.socket) {
          this.socket.close();
        }
      };
    } catch (err) {
      this.scheduleReconnect(token);
    }
  }

  scheduleReconnect(token) {
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
      this.connect(token);
    }, this.reconnectDelay);
  }

  disconnect() {
    clearTimeout(this.reconnectTimeout);
    clearInterval(this.pingInterval);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService();
