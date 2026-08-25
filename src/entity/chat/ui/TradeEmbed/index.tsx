import React, { memo, useCallback, useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { Card, Button } from '~/shared/ui';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';
import { useReservationDraftStore } from '~/shared/store/useReservationDraftStore';
import { logger } from '~/shared/lib/logger';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const formatReservationDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${WEEKDAY_LABELS[date.getDay()]})`;
};

export interface TradeEmbedProps {
  readonly product: TradeProduct;
  readonly onTradeAccept?: () => Promise<void>;
  readonly onOpenReservationModal?: () => void;
  readonly onCancelReservation?: () => void;
  readonly showButtons?: boolean;
  readonly isLoading?: boolean;
  readonly requestorNickname?: string;
  readonly alignment?: 'left' | 'right';
  readonly onReviewButtonPress?: () => void;
  readonly showReviewButton?: boolean;
}

const TradeEmbedComponent: React.FC<TradeEmbedProps> = ({
  product,
  onTradeAccept,
  onOpenReservationModal,
  onCancelReservation,
  showButtons = false,
  isLoading = false,
  requestorNickname = '상대방',
  alignment = 'left',
  onReviewButtonPress,
  showReviewButton = false,
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const reservationDraft = useReservationDraftStore((state) => state.drafts[product.id]);

  const handleTradeAccept = useCallback(async () => {
    if (!onTradeAccept || localLoading || isLoading) return;

    try {
      setLocalLoading(true);
      await onTradeAccept();
    } catch (error) {
      logger.error('TradeEmbed action failed', error);
    } finally {
      setLocalLoading(false);
    }
  }, [onTradeAccept, localLoading, isLoading]);

  const handleCancelReservation = useCallback(async () => {
    if (!onCancelReservation || localLoading || isLoading) return;

    try {
      setLocalLoading(true);
      await onCancelReservation();
    } catch (error) {
      logger.error('TradeEmbed action failed', error);
    } finally {
      setLocalLoading(false);
    }
  }, [onCancelReservation, localLoading, isLoading]);

  const productImage = product.images[0];

  const alignmentClass = alignment === 'right' ? 'self-end' : 'self-start';

  const reservationDetailLabel = reservationDraft
    ? `${formatReservationDate(reservationDraft.date)} · ${reservationDraft.time} · ${reservationDraft.place}`
    : null;

  return (
    <View className={`mb-4 ${alignmentClass}`}>
      <Card variant="default" padding="none" className="overflow-hidden">
        <View className="p-4">
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
        </View>

        <View className="p-4">
          <Text className="mb-2 text-lg font-bold text-gray-900" numberOfLines={1}>
            {product.title}
          </Text>
          <Text className="mb-4 text-sm text-gray-600">
            {product.isCompleted
              ? '거래가 완료되었습니다'
              : `${requestorNickname}님께서 거래하기를 누르셨습니다`}
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
          {showButtons && !product.isCompleted && (
            <View className="flex-row justify-between">
              {product.isSeller &&
                (product.isReserved ? (
                  <Button
                    variant="secondary"
                    onPress={handleCancelReservation}
                    disabled={localLoading || isLoading}
                    width="w-[48%]"
                    style={{ minHeight: 40 }}>
                    {localLoading || isLoading ? (
                      <ActivityIndicator size="small" color="#8FC31D" />
                    ) : (
                      <Text className="text-sm font-medium text-[#8FC31D]">예약 취소</Text>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onPress={onOpenReservationModal}
                    disabled={localLoading || isLoading}
                    width="w-[48%]"
                    style={{ minHeight: 40 }}>
                    <Text className="text-sm font-medium text-[#8FC31D]">예약하기</Text>
                  </Button>
                ))}

              <Button
                variant="primary"
                onPress={handleTradeAccept}
                disabled={localLoading || isLoading}
                width={product.isSeller ? 'w-[48%]' : 'w-full'}
                style={{ minHeight: 40 }}>
                {localLoading || isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-sm font-medium text-white">거래 완료하기</Text>
                )}
              </Button>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
};

export const TradeEmbed = memo(TradeEmbedComponent);
TradeEmbed.displayName = 'TradeEmbed';
