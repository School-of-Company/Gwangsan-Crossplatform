import { AxiosError } from 'axios';
import { getPosts } from '../getPosts';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

const makeRawPost = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '테스트 게시글',
  content: '내용',
  gwangsan: '광산구',
  type: 'OBJECT',
  mode: 'GIVER',
  images: ['https://example.com/img.jpg'],
  isCompletable: true,
  isCompleted: false,
  ...overrides,
});

describe('getPosts', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('성공 케이스', () => {
    it('응답 데이터를 PostType 형태로 변환해 반환한다', async () => {
      mockGet.mockResolvedValue({ data: [makeRawPost()] });

      const result = await getPosts();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        title: '테스트 게시글',
        imageUrls: ['https://example.com/img.jpg'],
        isCompletable: true,
        isCompleted: false,
      });
    });

    it('images가 없으면 imageUrls를 빈 배열로 설정한다', async () => {
      mockGet.mockResolvedValue({ data: [makeRawPost({ images: undefined })] });

      const result = await getPosts();

      expect(result[0].imageUrls).toEqual([]);
    });

    it('isCompletable이 없으면 false로 기본값을 설정한다', async () => {
      mockGet.mockResolvedValue({ data: [makeRawPost({ isCompletable: undefined })] });

      const result = await getPosts();

      expect(result[0].isCompletable).toBe(false);
    });

    it('type이 있으면 쿼리스트링에 포함한다', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await getPosts('OBJECT');

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('type=OBJECT'));
    });

    it('mode가 있으면 쿼리스트링에 포함한다', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await getPosts(undefined, 'GIVER');

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('mode=GIVER'));
    });

    it('params 없이 호출하면 빈 쿼리스트링으로 요청한다', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await getPosts();

      expect(mockGet).toHaveBeenCalledWith('/post?');
    });
  });

  describe('에러 케이스', () => {
    it('Error 인스턴스는 메시지가 가공된 상태로 re-throw된다', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(getPosts()).rejects.toThrow('Network error');
    });

    it('AxiosError는 instanceof와 status 정보가 보존된다', async () => {
      const axiosError = new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, null, {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as never,
        data: { message: '서버 오류' },
      });
      mockGet.mockRejectedValue(axiosError);

      await expect(getPosts()).rejects.toBeInstanceOf(AxiosError);
      await expect(getPosts()).rejects.toMatchObject({ response: { status: 500 } });
    });

    it('Error 인스턴스가 아닌 예외는 새 Error로 감싸 throw된다', async () => {
      mockGet.mockRejectedValue('string error');

      await expect(getPosts()).rejects.toBeInstanceOf(Error);
      await expect(getPosts()).rejects.toThrow('string error');
    });
  });
});
