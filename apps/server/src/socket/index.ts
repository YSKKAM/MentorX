import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { isOriginAllowed } from '../config/cors';
import { registerClassroomHandlers } from './classroom.handler';

/**
 * Initialize Socket.IO server with authentication and flexible CORS
 */
export const initSocket = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${(socket as any).user?.userId}`);
    
    registerClassroomHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${(socket as any).user?.userId} (${reason})`);
    });
  });

  return io;
};
