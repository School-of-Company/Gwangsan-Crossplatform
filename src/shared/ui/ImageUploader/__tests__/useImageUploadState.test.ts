import { act, renderHook } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { useUploadImage } from '~/shared/model/useUploadImage';
import { useImageUploadState } from '../useImageUploadState';

jest.mock('~/shared/model/useUploadImage', () => ({ useUploadImage: jest.fn() }));
jest.mock('react-native-toast-message', () => ({ show: jest.fn() }));
jest.mock('~/shared/lib/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn() } }));

const mockMutateAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useUploadImage as jest.Mock).mockReturnValue({ mutateAsync: mockMutateAsync });
});

const render = (images: string[] = [], overrides = {}) => {
  const onImagesChange = jest.fn();
  const onImageIdsChange = jest.fn();
  const onUploadStateChange = jest.fn();
  const hook = renderHook(
    ({ current }: { current: string[] }) =>
      useImageUploadState({
        images: current,
        initialImages: [],
        onImagesChange,
        onImageIdsChange,
        onUploadStateChange,
        ...overrides,
      }),
    { initialProps: { current: images } }
  );
  return { ...hook, onImagesChange, onImageIdsChange, onUploadStateChange };
};

describe('useImageUploadState', () => {
  it('고른 사진을 한 번에 추가하고, 업로드가 끝나면 이미지 id와 결과 토스트를 한 번 알린다', async () => {
    mockMutateAsync
      .mockResolvedValueOnce({ imageId: 1, imageUrl: 'https://cdn/1.jpg' })
      .mockResolvedValueOnce({ imageId: 2, imageUrl: 'https://cdn/2.jpg' });
    const { result, onImagesChange, onImageIdsChange } = render();

    await act(async () => {
      await result.current.handleImagesSelected([{ uri: 'a' }, { uri: 'b' }]);
    });

    expect(onImagesChange).toHaveBeenCalledWith(['a', 'b']);
    expect(onImageIdsChange).toHaveBeenLastCalledWith([1, 2]);
    expect(result.current.getImageStatus('a')?.status).toBe('uploaded');
    expect(Toast.show).toHaveBeenCalledTimes(1);
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('업로드 중이면 uploadState에 반영한다', async () => {
    mockMutateAsync.mockReturnValue(new Promise(() => {}));
    const { result, onUploadStateChange } = render();

    act(() => {
      result.current.handleImagesSelected([{ uri: 'a' }]);
    });

    expect(result.current.uploadState.hasUploadingImages).toBe(true);
    expect(onUploadStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ uploadingCount: 1, hasUploadingImages: true })
    );
  });

  it('업로드에 실패한 사진은 1.5초 뒤 자동으로 뺀다', async () => {
    jest.useFakeTimers();
    try {
      mockMutateAsync.mockRejectedValue(new Error('fail'));
      const { result, rerender, onImagesChange } = render();

      await act(async () => {
        await result.current.handleImagesSelected([{ uri: 'a' }]);
      });
      expect(result.current.getImageStatus('a')?.status).toBe('failed');
      rerender({ current: ['a'] });

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(onImagesChange).toHaveBeenLastCalledWith([]);
      expect(result.current.getImageStatus('a')).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('같은 원본(assetId)을 다시 고르면 중복으로 본다', async () => {
    mockMutateAsync.mockResolvedValue({ imageId: 1, imageUrl: 'u' });
    const { result } = render();

    await act(async () => {
      await result.current.handleImagesSelected([{ uri: 'tmp-1', assetId: 'asset-1' }]);
    });

    expect(result.current.isDuplicateSelection('tmp-2', 'asset-1')).toBe(true);
    expect(result.current.isDuplicateSelection('tmp-3', 'asset-2')).toBe(false);
  });
});
