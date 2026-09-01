import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface TradeCompletedEmbedProps {
  readonly alignment?: 'left' | 'right';
  readonly onReviewButtonPress?: () => void;
}

const TradeCompletedEmbedComponent: React.FC<TradeCompletedEmbedProps> = ({
  onReviewButtonPress,
}) => {
  return (
    <View className="mb-4 w-full">
      <View className="w-full flex-row items-center justify-between gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3">
        <Text testID="trade-completed-notice" className="flex-1 text-base font-bold text-gray-900">
          거래가 완료되었습니다
        </Text>
        <TouchableOpacity
          testID="trade-completed-review-button"
          onPress={onReviewButtonPress}
          className="shrink-0 rounded-lg bg-main-500 px-5 py-2.5">
          <Text className="text-label font-medium text-white">리뷰 작성하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const TradeCompletedEmbed = memo(TradeCompletedEmbedComponent);
TradeCompletedEmbed.displayName = 'TradeCompletedEmbed';
