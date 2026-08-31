import React, { memo } from 'react';
import { View, Text } from 'react-native';

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
}

const TradeReservedEmbedComponent: React.FC<TradeReservedEmbedProps> = ({
  alignment = 'left',
  scheduledAt,
  placeName,
}) => {
  const alignmentClass = alignment === 'right' ? 'self-end' : 'self-start ml-10';

  const detailLabel = scheduledAt
    ? [formatReservationSchedule(scheduledAt), placeName].filter(Boolean).join(' · ')
    : null;

  return (
    <View className={`mb-4 ${alignmentClass}`}>
      <View className="overflow-hidden rounded-xl bg-gray-50 px-4 py-3">
        <Text testID="trade-reserved-notice" className="text-sm font-medium text-[#8FC31D]">
          예약 중입니다
        </Text>
        {detailLabel && (
          <Text testID="trade-reservation-detail" className="mt-1 text-xs text-gray-600">
            {detailLabel}
          </Text>
        )}
      </View>
    </View>
  );
};

export const TradeReservedEmbed = memo(TradeReservedEmbedComponent);
TradeReservedEmbed.displayName = 'TradeReservedEmbed';
