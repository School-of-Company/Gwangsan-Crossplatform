import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface TradeCompletedEmbedProps {
  readonly alignment?: 'left' | 'right';
  readonly onReviewButtonPress?: () => void;
}

const TradeCompletedEmbedComponent: React.FC<TradeCompletedEmbedProps> = ({
  alignment = 'left',
  onReviewButtonPress,
}) => {
  const alignmentClass = alignment === 'right' ? 'self-end' : 'self-start ml-10';

  return (
    <View className={`mb-4 ${alignmentClass}`}>
      <View className="overflow-hidden rounded-xl bg-gray-50 px-4 py-3">
        <Text className="mb-2 text-sm text-gray-900">거래가 완료되었습니다</Text>
        <TouchableOpacity
          testID="trade-completed-review-button"
          onPress={onReviewButtonPress}
          className="self-start rounded-lg bg-main-500 px-4 py-2">
          <Text className="text-xs font-medium text-white">리뷰 작성하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const TradeCompletedEmbed = memo(TradeCompletedEmbedComponent);
TradeCompletedEmbed.displayName = 'TradeCompletedEmbed';
