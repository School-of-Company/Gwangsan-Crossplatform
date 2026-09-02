import type { SocketErrorPayload } from './socketService';

const BLOCKED_ERROR_CODE = 'BLOCKED';
const BLOCKED_MESSAGE_KEYWORD = '차단';

// 서버는 아직 code 필드를 보내지 않아 message 문자열로 판별한다.
// (School-of-Company/Gwangsan-Crossplatform#566)
export const isBlockedSocketError = (error: SocketErrorPayload): boolean =>
  error.code === BLOCKED_ERROR_CODE || Boolean(error.message?.includes(BLOCKED_MESSAGE_KEYWORD));
