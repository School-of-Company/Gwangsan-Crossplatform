import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const formatReservationSchedule = (isoDateTime: string) => {
  const [datePart, timePart] = isoDateTime.split('T');
  const [year, month, day] = (datePart || '').split('-').map(Number);
  if (!year || !month || !day) return isoDateTime;
  const date = new Date(year, month - 1, day);
  const time = timePart ? timePart.slice(0, 5) : '';
  return `${month}월 ${day}일 (${WEEKDAY_LABELS[date.getDay()]}) ${time}`.trim();
};

export interface TradeReservedEmbedProps {
  readonly alignment?: 'left' | 'right';
  readonly scheduledAt?: string | null;
  readonly placeName?: string | null;
  readonly otherPartyNickname?: string;
  readonly onOpenMap?: () => void;
}

const TradeReservedEmbedComponent: React.FC<TradeReservedEmbedProps> = ({
  scheduledAt,
  placeName,
  otherPartyNickname,
  onOpenMap,
}) => {
  const detailLabel = scheduledAt
    ? [formatReservationSchedule(scheduledAt), placeName].filter(Boolean).join(' · ')
    : null;

  return (
    <View className="mb-4 w-full">
      <View className="w-full flex-row items-center justify-between gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3">
        <View className="flex-1">
          <Text testID="trade-reserved-notice" className="text-base font-bold text-gray-900">
            {otherPartyNickname ? `${otherPartyNickname}님이 예약을 했어요` : '예약을 했어요'}
          </Text>
          {detailLabel && (
            <Text testID="trade-reservation-detail" className="mt-1 text-xs text-gray-600">
              {detailLabel}
            </Text>
          )}
        </View>
        {onOpenMap && (
          <TouchableOpacity
            testID="trade-reserved-map-button"
            onPress={onOpenMap}
            className="shrink-0 rounded-lg bg-main-500 px-5 py-2.5">
            <Text className="text-label font-medium text-white">지도 보기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const TradeReservedEmbed = memo(TradeReservedEmbedComponent);
TradeReservedEmbed.displayName = 'TradeReservedEmbed';
