import { act, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { renderHookWithProviders } from '~/test-utils';
import { useUploadImage } from '../useUploadImage';
import { uploadImage } from '../../api/uploadImage';

jest.mock('../../api/uploadImage', () => ({
  uploadImage: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

const mockUploadImage = uploadImage as jest.Mock;
const mockToast = Toast as jest.Mocked<typeof Toast>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useUploadImage', () => {
  it('업로드 성공 시 성공 Toast를 표시한다', async () => {
    mockUploadImage.mockResolvedValue({ id: 1, url: 'https://img.com/a.jpg' });

    const { result } = renderHookWithProviders(() => useUploadImage());

    await act(async () => {
      await result.current.mutateAsync('file:///path/to/image.jpg');
    });

    expect(mockToast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '이미지 업로드 성공' })
    );
  });

  it('업로드 성공 시 ImageType 데이터를 반환한다', async () => {
    const imageData = { id: 7, url: 'https://img.com/b.jpg' };
    mockUploadImage.mockResolvedValue(imageData);

    const { result } = renderHookWithProviders(() => useUploadImage());

    let data: unknown;
    await act(async () => {
      data = await result.current.mutateAsync('file:///path/to/image.jpg');
    });

    expect(data).toEqual(imageData);
  });

  it('업로드 실패 시 에러 Toast를 표시한다', async () => {
    mockUploadImage.mockRejectedValue(new Error('업로드 실패'));

    const { result } = renderHookWithProviders(() => useUploadImage());

    await act(async () => {
      try {
        await result.current.mutateAsync('file:///path/to/image.jpg');
      } catch {}
    });

    await waitFor(() => {
      expect(mockToast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '이미지 업로드 실패' })
      );
    });
  });

  it('업로드 실패 시 에러 메시지를 Toast text2에 포함한다', async () => {
    mockUploadImage.mockRejectedValue(new Error('파일 크기 초과'));

    const { result } = renderHookWithProviders(() => useUploadImage());

    await act(async () => {
      try {
        await result.current.mutateAsync('file:///path/to/image.jpg');
      } catch {}
    });

    await waitFor(() => {
      expect(mockToast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text2: '파일 크기 초과' })
      );
    });
  });

  it('초기 isPending 상태는 false이다', () => {
    const { result } = renderHookWithProviders(() => useUploadImage());

    expect(result.current.isPending).toBe(false);
  });
});
