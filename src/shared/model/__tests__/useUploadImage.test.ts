import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useUploadImage } from '../useUploadImage';
import { uploadImage } from '../../api/uploadImage';
import Toast from 'react-native-toast-message';

jest.mock('../../api/uploadImage', () => ({
  uploadImage: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockUploadImage = uploadImage as jest.Mock;

describe('useUploadImage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mutationFn으로 uploadImage를 호출한다', async () => {
    const mockResult = { imageId: 1, imageUrl: 'https://cdn.example.com/img.jpg' };
    mockUploadImage.mockResolvedValue(mockResult);

    const { result } = renderHookWithProviders(() => useUploadImage());

    await act(async () => {
      result.current.mutate('file:///local/photo.jpg');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUploadImage).toHaveBeenCalledWith('file:///local/photo.jpg');
  });

  it('업로드 성공 시 성공 Toast를 표시한다', async () => {
    mockUploadImage.mockResolvedValue({ imageId: 1, imageUrl: '' });

    const { result } = renderHookWithProviders(() => useUploadImage());

    await act(async () => {
      result.current.mutate('file:///local/photo.jpg');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '이미지 업로드 성공' })
    );
  });

  it('업로드 실패 시 에러 Toast를 표시한다', async () => {
    mockUploadImage.mockRejectedValue(new Error('업로드 오류'));

    const { result } = renderHookWithProviders(() => useUploadImage());

    await act(async () => {
      result.current.mutate('file:///local/photo.jpg');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '이미지 업로드 실패', text2: '업로드 오류' })
    );
  });

  it('에러 메시지가 없으면 기본 메시지를 표시한다', async () => {
    mockUploadImage.mockRejectedValue(new Error(''));

    const { result } = renderHookWithProviders(() => useUploadImage());

    await act(async () => {
      result.current.mutate('file:///local/photo.jpg');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text2: '이미지 업로드 중 오류가 발생했습니다.',
      })
    );
  });
});
