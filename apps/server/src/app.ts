import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './modules/auth/auth.routes';
import classroomRoutes from './modules/classroom/classroom.routes';
import activityRoutes from './modules/activity/activity.routes';
import chatRoutes from './modules/chat/chat.routes';
import chatRoomsRoutes from './modules/chat/chat_rooms.routes';
import aiRoutes from './modules/ai/ai.routes';
import { assignmentRoutes } from './modules/assignment/assignment.routes';
import { plagiarismRoutes } from './modules/plagiarism/plagiarism.routes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';
import { corsOptions } from './config/cors';

const app = express();

app.use(helmet());
app.use(cors(corsOptions));

// Reduced limit from 50MB to 10MB for DoS prevention
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Global API Rate Limiter (1000 requests per 15 minutes)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth Rate Limiter for Login/Register (60 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many authentication attempts, please try again after a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI Rate Limiter (30 requests per minute)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'AI request limit reached, please wait a minute before making more requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', globalApiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', aiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-rooms', chatRoomsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/plagiarism', plagiarismRoutes);

app.use(errorHandler);

export default app;
