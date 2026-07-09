import { createItem } from '../createItem';
import { instance } from '~/shared/lib/axios';
import { logger } from '~/shared/lib/logger';
import { ItemFormRequestBody } from '../../model/itemFormSchema';

jest.mock('~/shared/lib/axios', () => ({
  instance: { post: jest.fn() },
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

const mockPost = instance.post as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

const makeRequestBody = (overrides: Partial<ItemFormRequestBody> = {}): ItemFormRequestBody => ({
  type: 'OBJECT',
  mode: 'GIVER',
  title: '제목',
  content: '내용',
  gwangsan: 10,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('createItem', () => {
  describe('성공 케이스', () => {
    it('POST /post 요청 후 응답 data를 반환한다', async () => {
      const body = makeRequestBody();
      const responseData = { id: 1, ...body };
      mockPost.mockResolvedValue({ data: responseData });

      const result = await createItem(body);

      expect(mockPost).toHaveBeenCalledWith('/post', body);
      expect(result).toEqual(responseData);
    });

    it('imageIds를 포함한 요청도 정상 처리한다', async () => {
      const body = makeRequestBody({ imageIds: [1, 2, 3] });
      mockPost.mockResolvedValue({ data: { id: 2, ...body } });

      await createItem(body);

      expect(mockPost).toHaveBeenCalledWith(
        '/post',
        expect.objectContaining({ imageIds: [1, 2, 3] })
      );
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw하고 logger.error를 호출한다', async () => {
      const body = makeRequestBody();
      mockPost.mockRejectedValue(new Error('Server error'));

      await expect(createItem(body)).rejects.toThrow();
      expect(mockLoggerError).toHaveBeenCalledWith('createItem failed', expect.any(Error));
    });

    it('에러 메시지가 toAppError를 통해 래핑된다', async () => {
      const body = makeRequestBody();
      mockPost.mockRejectedValue(new Error('Network Error'));

      await expect(createItem(body)).rejects.toThrow('Network Error');
    });
  });
});
