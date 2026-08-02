import http from 'http';
import app from './app';
import { env } from './config/env';
import { initDatabase } from './config/database';
import { initSocket } from './socket';

const startServer = async () => {
  try {
    await initDatabase();

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
