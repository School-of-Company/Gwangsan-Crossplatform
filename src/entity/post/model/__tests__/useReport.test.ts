import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useReport } from '../useReport';
import { report } from '../../api/report';
import Toast from 'react-native-toast-message';

jest.mock('../../api/report', () => ({
  report: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockReport = report as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useReport', () => {
  describe('초기 상태', () => {
    it('reportType이 null이다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      expect(result.current.reportType).toBeNull();
    });

    it('contents가 빈 문자열이다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      expect(result.current.contents).toBe('');
    });

    it('canSubmit이 false이다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      expect(result.current.canSubmit).toBe(false);
    });
  });

  describe('폼 상태 업데이트', () => {
    it('setReportType으로 신고 유형을 설정한다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      act(() => result.current.setReportType('SPAM_AD'));

      expect(result.current.reportType).toBe('SPAM_AD');
    });

    it('setContents로 신고 내용을 설정한다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      act(() => result.current.setContents('신고 내용입니다.'));

      expect(result.current.contents).toBe('신고 내용입니다.');
    });

    it('setImageIds로 이미지 ID 목록을 설정한다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      act(() => result.current.setImageIds([10, 20]));

      expect(result.current.imageIds).toEqual([10, 20]);
    });

    it('resetForm으로 모든 상태를 초기화한다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      act(() => {
        result.current.setReportType('ETC');
        result.current.setContents('내용');
        result.current.setImageIds([1]);
      });
      act(() => result.current.resetForm());

      expect(result.current.reportType).toBeNull();
      expect(result.current.contents).toBe('');
      expect(result.current.imageIds).toEqual([]);
    });
  });

  describe('canSubmit', () => {
    it('reportType과 contents가 모두 있으면 true이다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      act(() => {
        result.current.setReportType('SPAM_AD');
        result.current.setContents('신고 내용');
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it('reportType이 없으면 false이다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      act(() => result.current.setContents('신고 내용'));

      expect(result.current.canSubmit).toBe(false);
    });

    it('contents가 공백만 있으면 false이다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      act(() => {
        result.current.setReportType('ETC');
        result.current.setContents('   ');
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it('productId도 memberId도 없으면 false이다', () => {
      const { result } = renderHookWithProviders(() => useReport({}));

      act(() => {
        result.current.setReportType('ETC');
        result.current.setContents('내용');
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it('이미지 업로드 중이면 false이다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      act(() => {
        result.current.setReportType('ETC');
        result.current.setContents('내용');
        result.current.setImageUploadState({ hasUploadingImages: true, hasFailedImages: false });
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it('이미지 업로드 실패 상태이면 false이다', () => {
      const { result } = renderHookWithProviders(() => useReport({ productId: 1, memberId: 1 }));

      act(() => {
        result.current.setReportType('ETC');
        result.current.setContents('내용');
        result.current.setImageUploadState({ hasUploadingImages: false, hasFailedImages: true });
      });

      expect(result.current.canSubmit).toBe(false);
    });
  });

  describe('handleSubmit', () => {
    it('productId가 있으면 PRODUCT 타입으로 신고한다', async () => {
      mockReport.mockResolvedValue({});
      const { result } = renderHookWithProviders(() => useReport({ productId: 5, memberId: 42 }));

      await act(async () => {
        await result.current.handleSubmit('SPAM_AD', '스팸입니다.');
      });

      expect(mockReport).toHaveBeenCalledWith({
        targetType: 'PRODUCT',
        productId: 5,
        memberId: 42,
        reason: 'SPAM_AD',
        content: '스팸입니다.',
        imageIds: [],
      });
    });

    it('productId가 없고 memberId만 있으면 MEMBER 타입으로 신고한다', async () => {
      mockReport.mockResolvedValue({});
      const { result } = renderHookWithProviders(() => useReport({ memberId: 42 }));

      await act(async () => {
        await result.current.handleSubmit('ETC', '기타 사유입니다.');
      });

      expect(mockReport).toHaveBeenCalledWith({
        targetType: 'MEMBER',
        memberId: 42,
        reason: 'ETC',
        content: '기타 사유입니다.',
        imageIds: [],
      });
    });

    it('이미지 ID가 있으면 payload에 포함된다', async () => {
      mockReport.mockResolvedValue({});
      const { result } = renderHookWithProviders(() => useReport({ memberId: 42 }));

      act(() => result.current.setImageIds([10, 20]));
      await act(async () => {
        await result.current.handleSubmit('ETC', '내용');
      });

      expect(mockReport).toHaveBeenCalledWith(expect.objectContaining({ imageIds: [10, 20] }));
    });

    it('신고 성공 시 성공 Toast를 표시한다', async () => {
      mockReport.mockResolvedValue({});
      const { result } = renderHookWithProviders(() => useReport({ memberId: 42 }));

      await act(async () => {
        await result.current.handleSubmit('ETC', '내용');
      });

      await waitFor(() =>
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success', text1: '신고 완료' })
        )
      );
    });

    it('신고 성공 시 onSuccess 콜백을 호출한다', async () => {
      mockReport.mockResolvedValue({});
      const onSuccess = jest.fn();
      const { result } = renderHookWithProviders(() => useReport({ memberId: 42, onSuccess }));

      await act(async () => {
        await result.current.handleSubmit('ETC', '내용');
      });

      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });

    it('신고 성공 시 폼을 초기화한다', async () => {
      mockReport.mockResolvedValue({});
      const { result } = renderHookWithProviders(() => useReport({ memberId: 42 }));

      act(() => result.current.setReportType('ETC'));
      await act(async () => {
        await result.current.handleSubmit('ETC', '내용');
      });

      await waitFor(() => expect(result.current.reportType).toBeNull());
    });

    it('신고 실패 시 에러 Toast를 표시한다', async () => {
      mockReport.mockRejectedValue(new Error('신고 처리 실패'));
      const { result } = renderHookWithProviders(() => useReport({ memberId: 42 }));

      await act(async () => {
        await result.current.handleSubmit('ETC', '내용');
      });

      await waitFor(() =>
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error', text1: '신고 실패' })
        )
      );
    });

    it('이미지 업로드 중이면 신고를 실행하지 않는다', async () => {
      const { result } = renderHookWithProviders(() => useReport({ memberId: 42 }));

      act(() =>
        result.current.setImageUploadState({ hasUploadingImages: true, hasFailedImages: false })
      );
      await act(async () => {
        await result.current.handleSubmit('ETC', '내용');
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('이미지 업로드 실패 상태이면 신고를 실행하지 않는다', async () => {
      const { result } = renderHookWithProviders(() => useReport({ memberId: 42 }));

      act(() =>
        result.current.setImageUploadState({ hasUploadingImages: false, hasFailedImages: true })
      );
      await act(async () => {
        await result.current.handleSubmit('ETC', '내용');
      });

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('productId도 memberId도 없으면 에러 Toast를 표시한다', async () => {
      const { result } = renderHookWithProviders(() => useReport({}));

      await act(async () => {
        await result.current.handleSubmit('ETC', '내용');
      });

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '신고 실패' })
      );
      expect(mockReport).not.toHaveBeenCalled();
    });
  });
});
