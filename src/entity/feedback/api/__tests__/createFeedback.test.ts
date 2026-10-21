import { createFeedback } from '../createFeedback';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { post: jest.fn() },
}));

const mockPost = instance.post as jest.Mock;

const request = {
  type: 'BUG' as const,
  content: '채팅이 안 보내져요.',
  imageIds: [3],
  appVersion: '1.2.2',
  osType: 'IOS' as const,
  osVersion: '18.0',
  deviceModel: 'iPhone 15',
};

beforeEach(() => jest.clearAllMocks());

describe('createFeedback', () => {
  it('POST /feedback으로 요청 데이터를 그대로 전송한다', async () => {
    mockPost.mockResolvedValue({});

    await createFeedback(request);

    expect(mockPost).toHaveBeenCalledWith('/feedback', request);
  });

  it('요청이 실패하면 서버 메시지를 담은 에러를 던진다', async () => {
    mockPost.mockRejectedValue(new Error('전송 실패'));

    await expect(createFeedback(request)).rejects.toThrow('전송 실패');
  });
});
