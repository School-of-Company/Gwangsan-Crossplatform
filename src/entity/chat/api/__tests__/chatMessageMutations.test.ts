import { updateChatMessage } from '../updateChatMessage';
import { deleteChatMessage } from '../deleteChatMessage';
import { instance } from '@/shared/lib/axios';

jest.mock('@/shared/lib/axios', () => ({
  instance: { patch: jest.fn(), delete: jest.fn() },
}));

const mockPatch = instance.patch as jest.Mock;
const mockDelete = instance.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('updateChatMessage', () => {
  it('PATCH /chat/message/:id 로 수정할 내용을 보낸다', async () => {
    mockPatch.mockResolvedValue({ data: { messageId: 3, content: '수정', editedAt: 'T' } });

    const result = await updateChatMessage(3, '수정');

    expect(mockPatch).toHaveBeenCalledWith('/chat/message/3', { content: '수정' });
    expect(result).toEqual({ messageId: 3, content: '수정', editedAt: 'T' });
  });

  it('응답 본문이 없으면 undefined를 돌려준다', async () => {
    mockPatch.mockResolvedValue({ data: '' });

    await expect(updateChatMessage(3, '수정')).resolves.toBeUndefined();
  });

  it('실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    mockPatch.mockRejectedValue(new Error('24시간이 지난 메시지는 수정할 수 없습니다.'));

    await expect(updateChatMessage(3, '수정')).rejects.toThrow(
      '24시간이 지난 메시지는 수정할 수 없습니다.'
    );
  });
});

describe('deleteChatMessage', () => {
  it('DELETE /chat/message/:id 를 호출한다', async () => {
    mockDelete.mockResolvedValue({});

    await deleteChatMessage(9);

    expect(mockDelete).toHaveBeenCalledWith('/chat/message/9');
  });

  it('실패하면 에러를 던진다', async () => {
    mockDelete.mockRejectedValue(new Error('권한이 없습니다.'));

    await expect(deleteChatMessage(9)).rejects.toThrow('권한이 없습니다.');
  });
});
