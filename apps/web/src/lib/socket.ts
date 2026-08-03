import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private currentToken: string | null = null;

  connect(token: string) {
    if (!token) return null;

    // If socket exists but token changed, disconnect and reconnect
    if (this.socket && this.currentToken !== token) {
      this.disconnect();
    }

    if (!this.socket) {
      this.currentToken = token;
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // Prefer WebSocket first to eliminate XHR polling errors
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('Frontend connected to Socket.IO');
      });

      this.socket.on('connect_error', (err) => {
        console.warn('Socket connection warning:', err?.message || err);
        // If auth error, clear token so next reconnect gets fresh token
        if (err?.message?.includes('Authentication error')) {
          this.disconnect();
        }
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentToken = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
