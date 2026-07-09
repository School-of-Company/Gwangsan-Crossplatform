import { editPost } from '../editPost';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { patch: jest.fn() },
}));

const mockPatch = instance.patch as jest.Mock;

const makeEditData = (overrides: Record<string, unknown> = {}) => ({
  type: 'OBJECT',
  mode: 'GIVER',
  title: '수정된 제목',
  content: '수정된 내용',
  gwangsan: 1,
  imageIds: [1, 2],
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('editPost', () => {
  describe('성공 케이스', () => {
    it('PATCH /post/:id를 올바른 payload로 호출하고 응답 data를 반환한다', async () => {
      const data = makeEditData();
      const responseData = { id: 1, ...data };
      mockPatch.mockResolvedValue({ data: responseData });

      const result = await editPost('1', data);

      expect(mockPatch).toHaveBeenCalledWith('/post/1', data);
      expect(result).toEqual(responseData);
    });

    it('다른 postId로 올바른 경로를 요청한다', async () => {
      const data = makeEditData();
      mockPatch.mockResolvedValue({ data: {} });

      await editPost('99', data);

      expect(mockPatch).toHaveBeenCalledWith('/post/99', data);
    });

    it('imageIds가 빈 배열이어도 정상 요청한다', async () => {
      const data = makeEditData({ imageIds: [] });
      mockPatch.mockResolvedValue({ data: {} });

      await editPost('1', data);

      expect(mockPatch).toHaveBeenCalledWith('/post/1', expect.objectContaining({ imageIds: [] }));
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockPatch.mockRejectedValue(new Error('Bad Request'));

      await expect(editPost('1', makeEditData())).rejects.toThrow();
    });

    it('에러 메시지가 전파된다', async () => {
      mockPatch.mockRejectedValue(new Error('Server error'));

      await expect(editPost('1', makeEditData())).rejects.toThrow('Server error');
    });

    it('네트워크 에러 시 에러를 throw한다', async () => {
      mockPatch.mockRejectedValue(new Error('Network Error'));

      await expect(editPost('1', makeEditData())).rejects.toThrow('Network Error');
    });
  });
});
