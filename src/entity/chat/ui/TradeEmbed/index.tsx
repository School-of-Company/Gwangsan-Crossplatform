import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Button } from '~/shared/ui';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const formatReservationSchedule = (isoDateTime: string) => {
  const [datePart, timePart] = isoDateTime.split('T');
  const [year, month, day] = (datePart || '').split('-').map(Number);
  if (!year || !month || !day) return isoDateTime;
  const date = new Date(year, month - 1, day);
  const time = timePart ? timePart.slice(0, 5) : '';
  return `${month}월 ${day}일 (${WEEKDAY_LABELS[date.getDay()]}) ${time}`.trim();
};

export interface TradeEmbedProps {
  readonly product: TradeProduct;
  readonly showButtons?: boolean;
  readonly otherPartyNickname?: string;
  readonly alignment?: 'left' | 'right';
  readonly onReviewButtonPress?: () => void;
  readonly showReviewButton?: boolean;
  readonly onOpenReservationModal?: () => void;
}

const TradeEmbedComponent: React.FC<TradeEmbedProps> = ({
  product,
  showButtons = false,
  otherPartyNickname = '상대방',
  alignment = 'left',
  onReviewButtonPress,
  showReviewButton = false,
  onOpenReservationModal,
}) => {
  const productImage = product.images[0];

  const alignmentClass = alignment === 'right' ? 'self-end' : 'self-start ml-10';

  const reservationDetailLabel = product.reservationScheduledAt
    ? [formatReservationSchedule(product.reservationScheduledAt), product.reservationPlaceName]
        .filter(Boolean)
        .join(' · ')
    : null;

  if (!showButtons) {
    return (
      <View className="my-3 items-center">
        <View className="items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
          <Text className="text-xs text-gray-500">
            {product.isCompleted
              ? '거래가 완료되었습니다'
              : `${otherPartyNickname}님에게 거래를 요청했어요`}
          </Text>
          {!product.isCompleted && product.isReserved && (
            <View className="items-center gap-1">
              <Text testID="trade-reserved-notice" className="text-xs font-medium text-[#8FC31D]">
                예약 중입니다
              </Text>
              {reservationDetailLabel && (
                <Text testID="trade-reservation-detail" className="text-xs text-gray-500">
                  {reservationDetailLabel}
                </Text>
              )}
            </View>
          )}
          {showReviewButton && product.isCompleted && (
            <Button
              variant="primary"
              onPress={onReviewButtonPress}
              width="w-full"
              style={{ minHeight: 40 }}>
              <Text className="text-sm font-medium text-white">리뷰 작성하기</Text>
            </Button>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className={`mb-4 ${alignmentClass}`}>
      <View className="overflow-hidden rounded-xl bg-gray-50">
        <View className="px-4 pb-3 pt-5">
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

          <Text className="mb-2 text-sm text-gray-900">
            {product.isCompleted
              ? '거래가 완료되었습니다'
              : `${otherPartyNickname}님이 거래하기를 원합니다`}
          </Text>
          {!product.isCompleted && product.isReserved && (
            <View className="mb-4 gap-1">
              <Text testID="trade-reserved-notice" className="text-sm font-medium text-[#8FC31D]">
                예약 중입니다
              </Text>
              {reservationDetailLabel && (
                <Text testID="trade-reservation-detail" className="text-xs text-gray-600">
                  {reservationDetailLabel}
                </Text>
              )}
            </View>
          )}
          {showReviewButton && product.isCompleted && (
            <Button
              variant="primary"
              onPress={onReviewButtonPress}
              width="w-full"
              style={{ minHeight: 40 }}>
              <Text className="text-sm font-medium text-white">리뷰 작성하기</Text>
            </Button>
          )}
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
