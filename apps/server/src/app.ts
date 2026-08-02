import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';
import classroomRoutes from './modules/classroom/classroom.routes';
import activityRoutes from './modules/activity/activity.routes';
import chatRoutes from './modules/chat/chat.routes';
import chatRoomsRoutes from './modules/chat/chat_rooms.routes';
import aiRoutes from './modules/ai/ai.routes';
import { assignmentRoutes } from './modules/assignment/assignment.routes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-rooms', chatRoomsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assignments', assignmentRoutes);

app.use(errorHandler);

export default app;
