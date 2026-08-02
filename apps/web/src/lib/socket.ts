import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
      });

      this.socket.on('connect', () => {
        console.log('Frontend connected to Socket.IO');
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
