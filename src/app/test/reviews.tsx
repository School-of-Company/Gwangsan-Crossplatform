import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ReviewsModal } from '~/entity/posts';

export default function Reviews() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [light, setLight] = useState<number>(60);
  const [contents, setContents] = useState('');

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setLight(60);
    setContents('');
  };

  const handleSubmitReport = (type: number, reason: string) => {
    console.log('=== 신고 제출 ===');
    console.log('신고 유형:', type);
    console.log('신고 사유:', reason);
    console.log('================');

    handleCloseModal();
  };

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
        setLight={setLight}
        contents={contents}
        onContentsChange={setContents}
      />
    </View>
  );
}
