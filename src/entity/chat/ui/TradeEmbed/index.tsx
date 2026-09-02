import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';

export interface TradeEmbedProps {
  readonly product: TradeProduct;
  readonly showButtons?: boolean;
  readonly otherPartyNickname?: string;
  readonly alignment?: 'left' | 'right';
  readonly onOpenReservationModal?: () => void;
}

const TradeEmbedComponent: React.FC<TradeEmbedProps> = ({
  product,
  showButtons = false,
  otherPartyNickname = '상대방',
  alignment = 'left',
  onOpenReservationModal,
}) => {
  const productImage = product.images[0];

  const alignmentClass = alignment === 'right' ? 'self-end' : 'self-start ml-10';

  return (
    <View className={`mb-4 ${alignmentClass}`}>
      <View className="overflow-hidden rounded-xl bg-gray-50">
        <View className="px-4 pb-3 pt-5">
          {productImage && (
            <View className="mb-3 h-20 w-20 overflow-hidden rounded-lg">
              <Image
                source={{ uri: productImage.imageUrl }}
                className="h-full w-full"
                resizeMode="cover"
              />
              {product.images.length > 1 && (
                <View className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-black bg-opacity-60">
                  <Text className="text-xs font-bold text-white">+{product.images.length - 1}</Text>
                </View>
              )}
            </View>
          )}

          <Text className="mb-2 text-sm text-gray-900">
            {showButtons
              ? `${otherPartyNickname}님이 거래하기를 원합니다`
              : `${otherPartyNickname}님에게 거래를 요청했어요`}
          </Text>
          {product.isSeller && !product.isCompleted && !product.isReserved && (
            <TouchableOpacity
              onPress={onOpenReservationModal}
              className="w-full items-center rounded-lg bg-main-500 px-5 py-2.5">
              <Text className="text-label font-medium text-white">예약하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export const TradeEmbed = memo(TradeEmbedComponent);
TradeEmbed.displayName = 'TradeEmbed';
