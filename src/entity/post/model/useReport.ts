import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
import { report } from '../api/report';
import { ReportType, REPORT_TYPE_MAP } from './reportType';

interface UseReportParams {
  sourceId: number;
  onSuccess?: () => void;
}

export const useReport = ({ sourceId, onSuccess }: UseReportParams) => {
  const [reportType, setReportType] = useState<string | null>(null);
  const [contents, setContents] = useState('');
  const [imageIds, setImageIds] = useState<number[]>([]);

  const reportMutation = useMutation({
    mutationFn: (data: { reportType: ReportType; content: string; imageIds: number[] }) =>
      report({
        sourceId,
        reportType: data.reportType,
        content: data.content,
        imageIds: data.imageIds,
      }),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: '신고 완료',
        text2: '신고가 성공적으로 접수되었습니다.',
        visibilityTime: 2000,
      });
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: '신고 실패',
        text2: error instanceof Error ? error.message : '신고 처리 중 오류가 발생했습니다.',
        visibilityTime: 3000,
      });
    },
  });

  const resetForm = useCallback(() => {
    setReportType(null);
    setContents('');
    setImageIds([]);
  }, []);

  const handleSubmit = useCallback(
    (type: string, reason: string) => {
      const reportTypeValue = REPORT_TYPE_MAP[type];
      if (!reportTypeValue) {
        Toast.show({
          type: 'error',
          text1: '잘못된 신고 유형',
          text2: '올바른 신고 유형을 선택해주세요.',
          visibilityTime: 3000,
        });
        return;
      }

      reportMutation.mutate({
        reportType: reportTypeValue,
        content: reason,
        imageIds,
      });
    },
    [reportMutation, imageIds]
  );

  return {
    reportType,
    contents,
    imageIds,
    setReportType,
    setContents,
    setImageIds,
    handleSubmit,
    resetForm,
    isLoading: reportMutation.isPending,
    error: reportMutation.error,
  };
}; 