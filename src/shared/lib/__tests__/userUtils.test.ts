import { extractOtherUserInfo, checkIsMyPost, ensureMessagesArray } from '../userUtils';
import { getData } from '../getData';
import type { ChatMessageResponse } from '~/entity/chat/model/chatTypes';

jest.mock('../getData', () => ({
  getData: jest.fn(),
}));

const mockGetData = getData as jest.MockedFunction<typeof getData>;

const makeMessage = (overrides: Partial<ChatMessageResponse>): ChatMessageResponse => ({
  messageId: 1,
  roomId: 'room-1',
  content: '안녕하세요',
  isMine: false,
  senderId: 99,
  senderNickname: '상대방닉네임',
  createdAt: '2026-01-01T00:00:00.000Z',
  messageType: 'TEXT',
  checked: false,
  ...overrides,
});

describe('extractOtherUserInfo', () => {
  it('isMine이 false인 첫 메시지에서 nickname과 id를 반환한다', () => {
    const messages: ChatMessageResponse[] = [
      makeMessage({ isMine: true, senderId: 1, senderNickname: '나' }),
      makeMessage({ isMine: false, senderId: 42, senderNickname: '광산주민' }),
    ];

    const result = extractOtherUserInfo(messages);

    expect(result.nickname).toBe('광산주민');
    expect(result.id).toBe(42);
  });

  it('isMine이 false인 메시지가 없으면 nickname을 "상대방"으로 반환하고 id는 undefined이다', () => {
    const messages: ChatMessageResponse[] = [
      makeMessage({ isMine: true, senderId: 1, senderNickname: '나' }),
    ];

    const result = extractOtherUserInfo(messages);

    expect(result.nickname).toBe('상대방');
    expect(result.id).toBeUndefined();
  });

  it('빈 배열이면 nickname을 "상대방", id는 undefined로 반환한다', () => {
    const result = extractOtherUserInfo([]);

    expect(result.nickname).toBe('상대방');
    expect(result.id).toBeUndefined();
  });
});

describe('checkIsMyPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('저장된 memberId와 authorId가 같으면 true를 반환한다', async () => {
    mockGetData.mockResolvedValue('7');

    const result = await checkIsMyPost(7);

    expect(mockGetData).toHaveBeenCalledWith('memberId');
    expect(result).toBe(true);
  });

  it('authorId가 string 타입이어도 숫자 비교로 true를 반환한다', async () => {
    mockGetData.mockResolvedValue('7');

    const result = await checkIsMyPost('7');

    expect(result).toBe(true);
  });

  it('저장된 memberId와 authorId가 다르면 false를 반환한다', async () => {
    mockGetData.mockResolvedValue('5');

    const result = await checkIsMyPost(7);

    expect(result).toBe(false);
  });

  it('memberId가 0이면 false를 반환한다', async () => {
    mockGetData.mockResolvedValue('0');

    const result = await checkIsMyPost(0);

    expect(result).toBe(false);
  });

  it('memberId가 null이면 false를 반환한다', async () => {
    mockGetData.mockResolvedValue(null);

    const result = await checkIsMyPost(7);

    expect(result).toBe(false);
  });

  it('getData가 throw하면 false를 반환한다 (에러 전파 안 함)', async () => {
    mockGetData.mockRejectedValue(new Error('Storage error'));

    const result = await checkIsMyPost(7);

    expect(result).toBe(false);
  });
});

describe('ensureMessagesArray', () => {
  it('배열이면 그대로 반환한다', () => {
    const messages = [makeMessage({})];
    expect(ensureMessagesArray(messages)).toBe(messages);
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(ensureMessagesArray([])).toEqual([]);
  });

  it('null이면 빈 배열을 반환한다', () => {
    expect(ensureMessagesArray(null)).toEqual([]);
  });

  it('undefined이면 빈 배열을 반환한다', () => {
    expect(ensureMessagesArray(undefined)).toEqual([]);
  });

  it('객체이면 빈 배열을 반환한다', () => {
    expect(ensureMessagesArray({ 0: makeMessage({}) })).toEqual([]);
  });

  it('문자열이면 빈 배열을 반환한다', () => {
    expect(ensureMessagesArray('message')).toEqual([]);
  });
});
