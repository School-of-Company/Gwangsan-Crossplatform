import Toast from 'react-native-toast-message';
import { instance } from '~/shared/lib/axios';
import { getPosts } from '../getPosts';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

const mockInstance = instance as jest.Mocked<typeof instance>;
const mockToast = Toast as jest.Mocked<typeof Toast>;

const makeServerPost = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '제목',
  content: '내용',
  gwangsan: 100,
  type: 'SELL',
  mode: 'NORMAL',
  images: ['https://img.com/a.jpg'],
  isCompletable: true,
  isCompleted: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPosts', () => {
  describe('정상 응답', () => {
    it('서버 응답을 PostType 형태로 변환해 반환한다', async () => {
      mockInstance.get.mockResolvedValue({ data: [makeServerPost()] });

      const result = await getPosts();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        title: '제목',
        content: '내용',
        gwangsan: 100,
        type: 'SELL',
        mode: 'NORMAL',
        imageUrls: ['https://img.com/a.jpg'],
        isCompletable: true,
        isCompleted: false,
      });
    });

    it('images가 없으면 imageUrls를 빈 배열로 변환한다', async () => {
      mockInstance.get.mockResolvedValue({
        data: [makeServerPost({ images: undefined })],
      });

      const result = await getPosts();

      expect(result[0].imageUrls).toEqual([]);
    });

    it('isCompletable이 없으면 false로 기본값 처리된다', async () => {
      mockInstance.get.mockResolvedValue({
        data: [makeServerPost({ isCompletable: undefined })],
      });

      const result = await getPosts();

      expect(result[0].isCompletable).toBe(false);
    });

    it('isCompleted가 없으면 false로 기본값 처리된다', async () => {
      mockInstance.get.mockResolvedValue({
        data: [makeServerPost({ isCompleted: undefined })],
      });

      const result = await getPosts();

      expect(result[0].isCompleted).toBe(false);
    });

    it('빈 배열을 반환할 수 있다', async () => {
      mockInstance.get.mockResolvedValue({ data: [] });

      const result = await getPosts();

      expect(result).toEqual([]);
    });
  });

  describe('쿼리 파라미터', () => {
    it('type 파라미터를 URL에 포함한다', async () => {
      mockInstance.get.mockResolvedValue({ data: [] });

      await getPosts('SELL');

      expect(mockInstance.get).toHaveBeenCalledWith(expect.stringContaining('type=SELL'));
    });

    it('mode 파라미터를 URL에 포함한다', async () => {
      mockInstance.get.mockResolvedValue({ data: [] });

      await getPosts(undefined, 'NORMAL');

      expect(mockInstance.get).toHaveBeenCalledWith(expect.stringContaining('mode=NORMAL'));
    });

    it('type과 mode 모두 전달하면 둘 다 포함한다', async () => {
      mockInstance.get.mockResolvedValue({ data: [] });

      await getPosts('BUY', 'GWANGSAN');

      const calledUrl = (mockInstance.get as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl).toContain('type=BUY');
      expect(calledUrl).toContain('mode=GWANGSAN');
    });

    it('파라미터 없이 호출하면 쿼리스트링이 비어있다', async () => {
      mockInstance.get.mockResolvedValue({ data: [] });

      await getPosts();

      expect(mockInstance.get).toHaveBeenCalledWith('/post?');
    });
  });

  describe('에러 처리', () => {
    it('API 에러 발생 시 Toast를 표시하고 빈 배열을 반환한다', async () => {
      mockInstance.get.mockRejectedValue(new Error('서버 오류'));

      const result = await getPosts();

      expect(result).toEqual([]);
      expect(mockToast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '게시물 불러오기 실패' })
      );
    });

    it('에러 시 예외를 전파하지 않는다', async () => {
      mockInstance.get.mockRejectedValue(new Error('네트워크 오류'));

      await expect(getPosts()).resolves.toEqual([]);
    });
  });
});
