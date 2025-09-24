import React, { memo, useCallback, useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { Card, Button } from '~/shared/ui';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';

export interface TradeEmbedProps {
  readonly product: TradeProduct;
  readonly onTradeAccept?: () => Promise<void>;
  readonly onReservation?: () => void;
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
  onReservation,
  onCancelReservation,
  showButtons = false,
  isLoading = false,
  requestorNickname = '상대방',
  alignment = 'left',
  onReviewButtonPress,
  showReviewButton = false,
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [isReserved, setIsReserved] = useState(false);

  const handleTradeAccept = useCallback(async () => {
    if (!onTradeAccept || localLoading || isLoading) return;

    try {
      setLocalLoading(true);
      await onTradeAccept();
    } catch (error) {
      console.error(error);
    } finally {
      setLocalLoading(false);
    }
  }, [onTradeAccept, localLoading, isLoading]);

  const handleReservation = useCallback(async () => {
    if (!onReservation || localLoading || isLoading) return;

    try {
      setLocalLoading(true);
      await onReservation();
      setIsReserved(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLocalLoading(false);
    }
  }, [onReservation, localLoading, isLoading]);

  const handleCancelReservation = useCallback(async () => {
    if (!onCancelReservation || localLoading || isLoading) return;

    try {
      setLocalLoading(true);
      await onCancelReservation();
      setIsReserved(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLocalLoading(false);
    }
  }, [onCancelReservation, localLoading, isLoading]);

  const productImage = product.images[0];

  const alignmentClass = alignment === 'right' ? 'self-end' : 'self-start';

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
            <>
              <View className="flex-row justify-between">
                {isReserved ? (
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
                    onPress={handleReservation}
                    disabled={localLoading || isLoading}
                    width="w-[48%]"
                    style={{ minHeight: 40 }}>
                    {localLoading || isLoading ? (
                      <ActivityIndicator size="small" color="#8FC31D" />
                    ) : (
                      <Text className="text-sm font-medium text-[#8FC31D]">예약하기</Text>
                    )}
                  </Button>
                )}

                <Button
                  variant="primary"
                  onPress={handleTradeAccept}
                  disabled={localLoading || isLoading}
                  width="w-[48%]"
                  style={{ minHeight: 40 }}>
                  {localLoading || isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-sm font-medium text-white">거래 완료하기</Text>
                  )}
                </Button>
              </View>
            </>
          )}
        </View>
      </Card>
    </View>
  );
};

export const TradeEmbed = memo(TradeEmbedComponent);
TradeEmbed.displayName = 'TradeEmbed';
