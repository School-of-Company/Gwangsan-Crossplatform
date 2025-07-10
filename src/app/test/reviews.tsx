import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ReviewsModal } from '~/entity/reviews';

export default function Reviews() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [light, setLight] = useState<number>(60);
  const [contents, setContents] = useState('');

  const handleOpenModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setLight(60);
    setContents('');
  }, []);

  const handleSubmitReport = useCallback(
    (light: number, contents: string) => {
      console.log('=== 후기 제출 ===');
      console.log('밝기:', light);
      console.log('내용:', contents);
      console.log('================');

      handleCloseModal();
    },
    [handleCloseModal]
  );

  const handleLightChange = useCallback((value: number) => {
    setLight(value);
  }, []);

  const handleContentsChange = useCallback((value: string) => {
    setContents(value);
  }, []);

  return (
    <View className="flex-1 bg-white p-4">
      <View className="flex-1 items-center justify-center">
        <Text className="mb-8 text-2xl font-bold">후기작성 페이지</Text>
        <TouchableOpacity onPress={handleOpenModal} className="rounded-lg bg-green-500 px-6 py-3">
          <Text className="text-lg font-semibold text-white">후기작성 모달 열기</Text>
        </TouchableOpacity>
      </View>
      <ReviewsModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmitReport}
        light={light}
        setLight={handleLightChange}
        contents={contents}
        onContentsChange={handleContentsChange}
        onAnimationComplete={handleAnimationComplete}
      />
    </View>
  );
}
