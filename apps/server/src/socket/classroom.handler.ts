import { Server, Socket } from 'socket.io';
import * as activityService from '../modules/activity/activity.service';
import * as chatService from '../modules/chat/chat.service';
import * as aiService from '../modules/ai/ai.service';
/**
 * Register real-time socket handlers for classroom interactions
 */
export const registerClassroomHandlers = (io: Server, socket: Socket) => {
  const user = (socket as any).user;

  socket.on('classroom:join', async ({ classroomId }) => {
    // Note: Would typically verify user has access to classroom here
    socket.join(`classroom:${classroomId}`);
    (socket as any).currentClassroom = classroomId;
    
    // Broadcast status to teacher/classroom
    io.to(`classroom:${classroomId}`).emit('student:status-change', {
      studentId: user.userId,
      classroomId,
      status: 'online',
    });
  });

  socket.on('classroom:leave', async ({ classroomId }) => {
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
    } catch (error) {
      console.error('Error recording student activity via socket:', error);
    }
  });

  socket.on('chat:send-message', async (data) => {
    try {
      const { classroomId, chatRoomId, content, isAi, aiProvider, replyToId, prompt, generatedImage, messageType } = data;
      
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

      // Fetch sender display name from DB (JWT payload doesn't include displayName)
      const { query: dbQuery } = await import('../config/database');
      const userRow = await dbQuery('SELECT display_name FROM users WHERE id = $1', [user.userId]);
      const senderName = userRow.rows[0]?.display_name || 'Unknown';

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
