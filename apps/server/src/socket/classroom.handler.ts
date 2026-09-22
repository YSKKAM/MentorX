import { Server, Socket } from 'socket.io';
import * as activityService from '../modules/activity/activity.service';
import * as chatService from '../modules/chat/chat.service';
import * as aiService from '../modules/ai/ai.service';
import { query } from '../config/database';

/**
 * Helper to verify if a user has permission to access a classroom
 */
const canUserAccessClassroom = async (userId: string, userRole: string, classroomId: string): Promise<boolean> => {
  if (!classroomId || classroomId === 'global') return true;
  try {
    if (userRole === 'teacher') {
      const res = await query('SELECT id FROM classrooms WHERE id = $1 AND teacher_id = $2', [classroomId, userId]);
      return res.rows.length > 0;
    } else {
      const res = await query('SELECT id FROM classroom_students WHERE classroom_id = $1 AND student_id = $2', [classroomId, userId]);
      return res.rows.length > 0;
    }
  } catch (err) {
    console.error('Error checking classroom access:', err);
    return false;
  }
};

/**
 * Register real-time socket handlers for classroom interactions
 */
export const registerClassroomHandlers = (io: Server, socket: Socket) => {
  const user = (socket as any).user;

  socket.on('classroom:join', async ({ classroomId }) => {
    if (!classroomId) return;
    
    // Verify user has access to classroom
    const hasAccess = await canUserAccessClassroom(user.userId, user.role, classroomId);
    if (!hasAccess) {
      console.warn(`Unauthorized classroom join attempt by user ${user.userId} for classroom ${classroomId}`);
      socket.emit('error', { message: 'Forbidden: You do not belong to this classroom' });
      return;
    }

    socket.join(`classroom:${classroomId}`);
    (socket as any).currentClassroom = classroomId;
    
    // Broadcast status to teacher/classroom
    io.to(`classroom:${classroomId}`).emit('student:status-change', {
      studentId: user.userId,
      classroomId,
      status: 'online',
    });

    // Send initial Strict Mode configuration to joining socket
    try {
      const roomRes = await query(
        `SELECT strict_mode_enabled, block_paste, block_copy, block_cut, record_restricted_events FROM classrooms WHERE id = $1`,
        [classroomId]
      );
      if (roomRes.rows.length > 0) {
        socket.emit('classroom:strict-mode-toggle', {
          classroomId,
          ...roomRes.rows[0]
        });
      }
    } catch (err) {
      console.error('Error fetching strict mode config on join:', err);
    }
  });

  socket.on('classroom:leave', async ({ classroomId }) => {
    if (!classroomId) return;
    socket.leave(`classroom:${classroomId}`);
    if ((socket as any).currentClassroom === classroomId) {
      (socket as any).currentClassroom = null;
    }
    
    io.to(`classroom:${classroomId}`).emit('student:status-change', {
      studentId: user.userId,
      classroomId,
      status: 'offline',
    });
  });

  socket.on('student:activity', async (data) => {
    try {
      const { classroomId, language, status, currentFile, errors, metadata } = data;
      
      const hasAccess = await canUserAccessClassroom(user.userId, user.role, classroomId);
      if (!hasAccess) return;

      const activity = await activityService.recordActivity({
        student_id: user.userId,
        classroom_id: classroomId,
        language,
        status,
        current_file: currentFile,
        errors,
        metadata
      });

      // Broadcast back to the room for teacher dashboards to update
      io.to(`classroom:${classroomId}`).emit('classroom:activity-update', {
        studentId: user.userId,
        classroomId,
        activity,
      });

      if (errors && errors.length > 0) {
        io.to(`classroom:${classroomId}`).emit('confusion:update', {
          classroomId,
        });
      }
    } catch (error) {
      console.error('Error recording student activity via socket:', error);
    }
  });

  socket.on('teacher:toggle-strict-mode', async (data) => {
    try {
      const { classroomId, strict_mode_enabled, block_paste, block_copy, block_cut, record_restricted_events } = data;
      if (user.role !== 'teacher') return;

      const hasAccess = await canUserAccessClassroom(user.userId, user.role, classroomId);
      if (!hasAccess) return;

      const updated = await query(
        `UPDATE classrooms
         SET strict_mode_enabled = COALESCE($2, strict_mode_enabled),
             block_paste = COALESCE($3, block_paste),
             block_copy = COALESCE($4, block_copy),
             block_cut = COALESCE($5, block_cut),
             record_restricted_events = COALESCE($6, record_restricted_events),
             updated_at = NOW()
         WHERE id = $1 AND teacher_id = $7
         RETURNING id, strict_mode_enabled, block_paste, block_copy, block_cut, record_restricted_events`,
        [
          classroomId,
          strict_mode_enabled !== undefined ? strict_mode_enabled : null,
          block_paste !== undefined ? block_paste : null,
          block_copy !== undefined ? block_copy : null,
          block_cut !== undefined ? block_cut : null,
          record_restricted_events !== undefined ? record_restricted_events : null,
          user.userId
        ]
      );

      if (updated.rows.length > 0) {
        const settings = updated.rows[0];
        io.to(`classroom:${classroomId}`).emit('classroom:strict-mode-toggle', {
          classroomId,
          ...settings
        });
      }
    } catch (err) {
      console.error('Error toggling strict mode:', err);
    }
  });

  socket.on('student:restricted-action', async (data) => {
    try {
      const { classroomId, eventType, currentFile, attemptCount } = data;
      const hasAccess = await canUserAccessClassroom(user.userId, user.role, classroomId);
      if (!hasAccess) return;

      const res = await query('SELECT display_name FROM users WHERE id = $1', [user.userId]);
      const studentName = res.rows[0]?.display_name || 'Student';

      await query(
        `INSERT INTO restricted_action_events (student_id, classroom_id, event_type, file_context, attempt_count)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.userId, classroomId, eventType || 'blocked_paste', currentFile || 'unknown', attemptCount || 1]
      );

      io.to(`classroom:${classroomId}`).emit('classroom:restricted-action-alert', {
        studentId: user.userId,
        studentName,
        classroomId,
        eventType: eventType || 'blocked_paste',
        fileContext: currentFile || 'unknown',
        attemptCount: attemptCount || 1,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error handling restricted action event:', err);
    }
  });

  socket.on('chat:send-message', async (data) => {
    try {
      const { classroomId, chatRoomId, content, isAi, aiProvider, replyToId, prompt, generatedImage, messageType } = data;
      
      // Enforce length limit
      if (!content || typeof content !== 'string' || content.trim().length === 0) return;
      if (content.length > 5000) {
        socket.emit('error', { message: 'Message exceeds maximum limit of 5000 characters' });
        return;
      }

      if (classroomId && classroomId !== 'global') {
        const hasAccess = await canUserAccessClassroom(user.userId, user.role, classroomId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Forbidden: You cannot chat in this classroom' });
          return;
        }
      }
      
      const savedMessage = await chatService.saveMessage({
        classroomId: classroomId || null,
        chatRoomId: chatRoomId || null,
        userId: user.userId,
        content,
        isAi,
        aiProvider,
        requestedByUserId: isAi ? user.userId : null,
        replyToId,
        prompt,
        generatedImage,
        messageType
      });

      // Fetch sender display name from DB
      const dbRes = await query('SELECT display_name FROM users WHERE id = $1', [user.userId]);
      const senderName = dbRes.rows[0]?.display_name || 'Unknown';

      const targetRoom = chatRoomId ? `chat_room:${chatRoomId}` : `classroom:${classroomId}`;
      io.to(targetRoom).emit('chat:new-message', {
        ...savedMessage,
        chat_room_id: chatRoomId || savedMessage.chat_room_id || null,
        classroom_id: savedMessage.classroom_id || classroomId || null,
        sender_id: user.userId,
        sender_name: senderName,
        sender_role: user.role || 'student',
        is_ai_response: isAi || false,
        ai_provider: aiProvider,
        reply_to_id: replyToId,
        prompt,
        generated_image: generatedImage,
        message_type: messageType || 'text',
        created_at: savedMessage.timestamp || savedMessage.created_at || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  });

  socket.on('chat:ask-ai', async (data) => {
    try {
      const { classroomId, chatRoomId, prompt, provider } = data;
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) return;
      if (prompt.length > 5000) {
        socket.emit('error', { message: 'Prompt exceeds maximum limit of 5000 characters' });
        return;
      }

      if (classroomId && classroomId !== 'global') {
        const hasAccess = await canUserAccessClassroom(user.userId, user.role, classroomId);
        if (!hasAccess) return;
      }

      const targetRoom = chatRoomId ? `chat_room:${chatRoomId}` : `classroom:${classroomId}`;
      
      io.to(targetRoom).emit('chat:ai-typing', { isTyping: true });

      const aiResponse = await aiService.generateAiResponse(provider || 'mock', prompt);
      
      const savedMessage = await chatService.saveMessage({
        classroomId: classroomId || null,
        chatRoomId: chatRoomId || null,
        content: aiResponse,
        isAi: true,
        aiProvider: provider || 'mock',
        requestedByUserId: user.userId
      });

      io.to(targetRoom).emit('chat:ai-typing', { isTyping: false });
      
      io.to(targetRoom).emit('chat:new-message', {
        ...savedMessage,
        sender_id: 'system',
        sender_name: 'AI Assistant',
        sender_role: 'ai',
        is_ai_response: true,
        ai_provider: provider || 'mock',
        ai_requested_by: user.displayName || 'Unknown',
        created_at: savedMessage.timestamp || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error asking AI:', error);
      const { classroomId, chatRoomId } = data;
      const targetRoom = chatRoomId ? `chat_room:${chatRoomId}` : `classroom:${classroomId}`;
      io.to(targetRoom).emit('chat:ai-typing', { isTyping: false });
    }
  });

  socket.on('chat_room:join', async ({ chatRoomId }) => {
    socket.join(`chat_room:${chatRoomId}`);
  });

  socket.on('chat_room:leave', async ({ chatRoomId }) => {
    socket.leave(`chat_room:${chatRoomId}`);
  });

  socket.on('disconnect', () => {
    const classroomId = (socket as any).currentClassroom;
    if (classroomId) {
      io.to(`classroom:${classroomId}`).emit('student:status-change', {
        studentId: user.userId,
        classroomId,
        status: 'offline',
      });
    }
  });
};
