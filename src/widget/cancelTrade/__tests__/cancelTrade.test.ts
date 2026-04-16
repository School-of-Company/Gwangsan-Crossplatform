import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { cancelTrade } from '../api/cancelTrade';
import { useCancelTrade } from '../model/useCancelTrade';
import Toast from 'react-native-toast-message';

jest.mock('../api/cancelTrade', () => ({
  cancelTrade: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/shared/ui/ImageUploader', () => ({}));

const mockCancelTrade = cancelTrade as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('cancelTrade API', () => {
  it('cancelTrade를 호출하면 응답을 반환한다', async () => {
    const mockRes = { status: 200, data: { success: true } };
    mockCancelTrade.mockResolvedValue(mockRes);

    const result = await cancelTrade('철회 사유', [1, 2], 99);

    expect(mockCancelTrade).toHaveBeenCalledWith('철회 사유', [1, 2], 99);
    expect(result).toEqual(mockRes);
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockCancelTrade.mockRejectedValue(new Error('Server error'));

    await expect(cancelTrade('사유', [], 1)).rejects.toThrow('Server error');
  });
});

describe('useCancelTrade', () => {
  it('초기 상태: reason은 빈 문자열, imageIds는 빈 배열이다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    expect(result.current.reason).toBe('');
    expect(result.current.imageIds).toEqual([]);
  });

  it('setReason으로 reason을 업데이트한다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setReason('철회 사유입니다');
    });

    expect(result.current.reason).toBe('철회 사유입니다');
  });

  it('setImageIds로 imageIds를 업데이트한다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setImageIds([10, 20]);
    });

    expect(result.current.imageIds).toEqual([10, 20]);
  });

  it('reason이 비어있고 productId가 있으면 canSubmit이 false이다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    expect(result.current.canSubmit).toBe(false);
  });

  it('reason이 공백만 있고 productId가 있으면 canSubmit이 false이다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setReason('   ');
    });

    expect(result.current.canSubmit).toBe(false);
  });

  it('productId가 없고 reason도 비어있으면 canSubmit이 true이다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: undefined }));

    expect(result.current.canSubmit).toBe(true);
  });

  it('reason이 있으면 canSubmit이 true이다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setReason('충분한 사유');
    });

    expect(result.current.canSubmit).toBe(true);
  });

  it('handleSubmit 성공 시 성공 Toast를 표시하고 onSuccess를 호출한다', async () => {
    mockCancelTrade.mockResolvedValue({});
    const onSuccess = jest.fn();

    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 5, onSuccess }));

    act(() => {
      result.current.setReason('철회 사유');
    });

    await act(async () => {
      result.current.handleSubmit('철회 사유');
    });

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '거래철회 완료' })
      )
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('handleSubmit 실패 시 에러 Toast를 표시한다', async () => {
    mockCancelTrade.mockRejectedValue(new Error('철회 실패'));

    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 5 }));

    act(() => {
      result.current.setReason('사유');
    });

    await act(async () => {
      result.current.handleSubmit('사유');
    });

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '거래철회 실패', text2: '철회 실패' })
      )
    );
  });

  it('handleSubmit non-Error 실패 시 기본 오류 메시지 Toast를 표시한다', async () => {
    mockCancelTrade.mockRejectedValue('string error');

    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 5 }));

    act(() => {
      result.current.setReason('사유');
    });

    await act(async () => {
      result.current.handleSubmit('사유');
    });

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: '거래철회 실패',
          text2: '거래철회 처리 중 오류가 발생했습니다.',
        })
      )
    );
  });

  it('resetForm으로 상태를 초기화한다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setReason('사유');
      result.current.setImageIds([1]);
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.reason).toBe('');
    expect(result.current.imageIds).toEqual([]);
  });

  it('productId가 없으면 handleSubmit 시 에러 Toast를 표시한다', async () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: undefined }));

    act(() => {
      result.current.setReason('사유');
    });

    act(() => {
      result.current.handleSubmit('사유');
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '거래철회 실패' })
    );
  });

  it('setImageUploadState로 imageUploadState를 업데이트한다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setImageUploadState({
        totalImages: 0,
        uploadingCount: 0,
        uploadedCount: 0,
        hasUploadingImages: false,
        hasFailedImages: false,
      });
    });

    expect(result.current.imageUploadState).toEqual({
      totalImages: 0,
      uploadingCount: 0,
      uploadedCount: 0,
      hasUploadingImages: false,
      hasFailedImages: false,
    });
  });

  it('imageUploadState.hasUploadingImages=true이면 canSubmit이 false이다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setReason('사유');
      result.current.setImageUploadState({
        totalImages: 1,
        uploadingCount: 1,
        uploadedCount: 0,
        hasUploadingImages: true,
        hasFailedImages: false,
      });
    });

    expect(result.current.canSubmit).toBe(false);
  });

  it('imageUploadState.hasFailedImages=true이면 canSubmit이 false이다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setReason('사유');
      result.current.setImageUploadState({
        totalImages: 1,
        uploadingCount: 0,
        uploadedCount: 0,
        hasUploadingImages: false,
        hasFailedImages: true,
      });
    });

    expect(result.current.canSubmit).toBe(false);
  });

  it('이미지 업로드 중이면 handleSubmit 시 대기 Toast를 표시한다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setReason('사유');
      result.current.setImageUploadState({
        totalImages: 1,
        uploadingCount: 1,
        uploadedCount: 0,
        hasUploadingImages: true,
        hasFailedImages: false,
      });
    });

    act(() => {
      result.current.handleSubmit('사유');
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: '이미지 업로드가 완료될 때까지 기다려주세요.',
      })
    );
  });

  it('이미지 업로드 실패 상태이면 handleSubmit 시 실패 Toast를 표시한다', () => {
    const { result } = renderHookWithProviders(() => useCancelTrade({ productId: 1 }));

    act(() => {
      result.current.setReason('사유');
      result.current.setImageUploadState({
        totalImages: 1,
        uploadingCount: 0,
        uploadedCount: 0,
        hasUploadingImages: false,
        hasFailedImages: true,
      });
    });

    act(() => {
      result.current.handleSubmit('사유');
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '이미지 업로드 실패' })
    );
  });
});
