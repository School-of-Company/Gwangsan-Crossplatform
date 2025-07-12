import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import ReportModal from '~/entity/reviews/ui/ReportModal';

export default function Report() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reportType, setReportType] = useState<string | null>(null);
  const [contents, setContents] = useState('');

  const handleOpenModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setReportType(null);
    setContents('');
  }, []);

  const handleSubmitReport = useCallback(
    (type: string, reason: string) => {
      console.log('=== 신고 제출 ===');
      console.log('신고 유형:', type);
      console.log('신고 사유:', reason);
      console.log('================');

      handleCloseModal();
    },
    [handleCloseModal]
  );

  const handleReportTypeChange = useCallback((type: string | null) => {
    setReportType(type);
  }, []);

  const handleContentsChange = useCallback((value: string) => {
    setContents(value);
  }, []);

  return (
    <View className="flex-1 bg-white p-4">
      <View className="flex-1 items-center justify-center">
        <Text className="mb-8 text-2xl font-bold">신고 페이지</Text>
        <TouchableOpacity onPress={handleOpenModal} className="rounded-lg bg-red-500 px-6 py-3">
          <Text className="text-lg font-semibold text-white">신고하기 모달 열기</Text>
        </TouchableOpacity>
      </View>
      <ReportModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmitReport}
        reportType={reportType}
        contents={contents}
        onReportTypeChange={handleReportTypeChange}
        onContentsChange={handleContentsChange}
        onAnimationComplete={handleAnimationComplete}
      />
    </View>
  );
}
