import { instance } from '~/shared/lib/axios';
import { getReceiveReview, getTossReview } from '../api/getReviews';
import Toast from 'react-native-toast-message';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getReceiveReview', () => {
  it('GET /review/:id 응답을 반환한다', async () => {
    const mockResponse = { data: [{ id: 1, title: '후기' }] };
    mockGet.mockResolvedValue(mockResponse);

    const result = await getReceiveReview('3');

    expect(mockGet).toHaveBeenCalledWith('/review/3');
    expect(result).toEqual(mockResponse);
  });

  it('API 실패 시 Toast 에러를 표시하고 에러를 던진다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('Server error'));

    await expect(getReceiveReview('3')).rejects.toThrow('Server error');
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '후기 조회 실패' })
    );
  });
});

describe('getTossReview', () => {
  it('GET /review 응답을 반환한다', async () => {
    const mockResponse = { data: [{ id: 2, title: '내가 준 후기' }] };
    mockGet.mockResolvedValue(mockResponse);

    const result = await getTossReview();

    expect(mockGet).toHaveBeenCalledWith('/review');
    expect(result).toEqual(mockResponse);
  });

  it('API 실패 시 Toast 에러를 표시하고 에러를 던진다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(getTossReview()).rejects.toThrow('Network error');
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '후기 조회 실패' })
    );
  });
});
