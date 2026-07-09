import { deletePost } from '../deletePost';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { delete: jest.fn() },
}));

const mockDelete = instance.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('deletePost', () => {
  describe('성공 케이스', () => {
    it('DELETE /post/:id를 호출한다', async () => {
      mockDelete.mockResolvedValue({});

      await deletePost(1);

      expect(mockDelete).toHaveBeenCalledWith('/post/1');
    });

    it('다른 postId로 올바른 경로를 요청한다', async () => {
      mockDelete.mockResolvedValue({});

      await deletePost(99);

      expect(mockDelete).toHaveBeenCalledWith('/post/99');
    });

    it('반환값이 없다 (void)', async () => {
      mockDelete.mockResolvedValue({});

      const result = await deletePost(1);

      expect(result).toBeUndefined();
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockDelete.mockRejectedValue(new Error('Not found'));

      await expect(deletePost(999)).rejects.toThrow();
    });

    it('에러 메시지가 전파된다', async () => {
      mockDelete.mockRejectedValue(new Error('Server error'));

      await expect(deletePost(1)).rejects.toThrow('Server error');
    });

    it('네트워크 에러 시 에러를 throw한다', async () => {
      mockDelete.mockRejectedValue(new Error('Network Error'));

      await expect(deletePost(1)).rejects.toThrow('Network Error');
    });
  });
});
