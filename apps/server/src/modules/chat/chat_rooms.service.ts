import { query } from '../../config/database';
import crypto from 'crypto';

export interface ChatRoomData {
  id: string;
  name: string;
  join_code: string;
  creator_id: string;
  created_at: string;
}

const generateJoinCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters
};

export const createChatRoom = async (name: string, creatorId: string) => {
  const joinCode = generateJoinCode();
  const sql = `
    INSERT INTO chat_rooms (name, join_code, creator_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await query(sql, [name, joinCode, creatorId]);
  return result.rows[0];
};

export const getChatRoomByCode = async (joinCode: string) => {
  const sql = `SELECT * FROM chat_rooms WHERE join_code = $1`;
  const result = await query(sql, [joinCode]);
  return result.rows[0];
};

export const getChatRoomById = async (id: string) => {
  const sql = `SELECT * FROM chat_rooms WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0];
};
