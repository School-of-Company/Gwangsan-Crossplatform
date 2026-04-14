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
});
