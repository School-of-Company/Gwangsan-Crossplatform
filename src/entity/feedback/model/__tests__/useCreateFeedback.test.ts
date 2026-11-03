import { act, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { renderHookWithProviders } from '~/test-utils';
import { useCreateFeedback } from '../useCreateFeedback';
import { feedbackQueryKeys } from '../feedbackQueryKeys';
import { createFeedback } from '../../api/createFeedback';

jest.mock('../../api/createFeedback', () => ({
  createFeedback: jest.fn(),
}));

jest.mock('../getFeedbackEnvironment', () => ({
  getFeedbackEnvironment: () => ({
    appVersion: '1.2.3',
    osType: 'IOS',
    osVersion: '18.0',
    deviceModel: 'iPhone 15',
  }),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockCreateFeedback = createFeedback as jest.Mock;
const mockToastShow = Toast.show as jest.Mock;

const params = { type: 'BUG' as const, content: '채팅이 안 보내져요.', imageIds: [1] };

beforeEach(() => jest.clearAllMocks());

describe('useCreateFeedback', () => {
  it('입력값에 기기 환경 정보를 붙여 전송한다', async () => {
    mockCreateFeedback.mockResolvedValue(undefined);
    const { result } = renderHookWithProviders(() => useCreateFeedback());

    act(() => result.current.createFeedback(params));

    await waitFor(() =>
      expect(mockCreateFeedback).toHaveBeenCalledWith({
        ...params,
        appVersion: '1.2.3',
        osType: 'IOS',
        osVersion: '18.0',
        deviceModel: 'iPhone 15',
      })
    );
  });

  it('성공하면 내 문의 목록을 무효화하고 토스트와 onSuccess를 호출한다', async () => {
    mockCreateFeedback.mockResolvedValue(undefined);
    const onSuccess = jest.fn();
    const { result, queryClient } = renderHookWithProviders(() => useCreateFeedback(onSuccess));
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    act(() => result.current.createFeedback(params));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: feedbackQueryKeys.myList() });
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '의견 접수 완료' })
    );
  });

  it('실패하면 에러 메시지로 토스트를 띄우고 onSuccess를 부르지 않는다', async () => {
    mockCreateFeedback.mockRejectedValue(new Error('서버 오류'));
    const onSuccess = jest.fn();
    const { result } = renderHookWithProviders(() => useCreateFeedback(onSuccess));

    act(() => result.current.createFeedback(params));

    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '의견 전송 실패', text2: '서버 오류' })
      )
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('Error가 아닌 값으로 실패하면 기본 문구를 보여준다', async () => {
    mockCreateFeedback.mockRejectedValue('unknown');
    const { result } = renderHookWithProviders(() => useCreateFeedback());

    act(() => result.current.createFeedback(params));

    await waitFor(() =>
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({ text2: '의견 전송 중 오류가 발생했습니다.' })
      )
    );
  });

  it('전송 중에는 isLoading이 true다', async () => {
    let resolve: () => void = () => {};
    mockCreateFeedback.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    const { result } = renderHookWithProviders(() => useCreateFeedback());

    act(() => result.current.createFeedback(params));

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    await act(async () => resolve());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
