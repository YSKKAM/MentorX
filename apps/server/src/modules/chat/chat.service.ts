import { query } from '../../config/database';

export interface ChatMessageData {
  classroomId?: string | null;
  chatRoomId?: string | null;
  userId?: string | null;
  content: string;
  isAi?: boolean;
  aiProvider?: string | null;
  requestedByUserId?: string | null;
  replyToId?: string | null;
  prompt?: string | null;
  generatedImage?: string | null;
  messageType?: string | 'text' | 'code' | 'image';
}

/**
 * Save a new chat message to the database.
 * 
 * @param data - The message details
 * @returns The saved message record
 */
export const saveMessage = async (data: ChatMessageData) => {
  const sql = `
    INSERT INTO chat_messages 
      (classroom_id, chat_room_id, user_id, content, is_ai, ai_provider, requested_by_user_id, reply_to_id, prompt, generated_image, message_type)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;
  
  const isGlobal = data.classroomId === 'global';
  const values = [
    isGlobal ? null : (data.classroomId || null),
    data.chatRoomId || null,
    data.userId || null,
    data.content,
    data.isAi || false,
    data.aiProvider || null,
    data.requestedByUserId || null,
    data.replyToId || null,
    data.prompt || null,
    data.generatedImage || null,
    data.messageType || 'text',
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Fetch the last 100 messages for a classroom.
 * Joins with users table to get display names.
 * 
 * @param classroomId - The ID of the classroom
 * @returns Array of chat messages
 */
export const getMessages = async (classroomId: string) => {
  const sql = `
    SELECT 
      m.id, 
      m.classroom_id,
      m.user_id as sender_id,
      m.content, 
      m.timestamp as created_at, 
      m.is_ai as is_ai_response, 
      m.ai_provider,
      m.reply_to_id,
      m.prompt,
      m.generated_image,
      m.message_type,
      u.display_name as sender_name,
      u.role as sender_role,
      req.display_name as ai_requested_by
    FROM chat_messages m
    LEFT JOIN users u ON m.user_id = u.id
    LEFT JOIN users req ON m.requested_by_user_id = req.id
    WHERE m.classroom_id ${classroomId === 'global' ? 'IS NULL' : '= $1'}
    ORDER BY m.timestamp ASC
    LIMIT 100;
  `;
  
  const result = await query(sql, classroomId === 'global' ? [] : [classroomId]);
  return result.rows;
};

/**
 * Fetch the last 100 messages for a private chat room.
 */
export const getChatRoomMessages = async (chatRoomId: string) => {
  const sql = `
    SELECT 
      m.id, 
      m.chat_room_id as classroom_id,
      m.user_id as sender_id,
      m.content, 
      m.timestamp as created_at, 
      m.is_ai as is_ai_response, 
      m.ai_provider,
      m.reply_to_id,
      m.prompt,
      m.generated_image,
      m.message_type,
      u.display_name as sender_name,
      u.role as sender_role,
      req.display_name as ai_requested_by
    FROM chat_messages m
    LEFT JOIN users u ON m.user_id = u.id
    LEFT JOIN users req ON m.requested_by_user_id = req.id
    WHERE m.chat_room_id = $1
    ORDER BY m.timestamp ASC
    LIMIT 100;
  `;
  
  const result = await query(sql, [chatRoomId]);
  return result.rows;
};
