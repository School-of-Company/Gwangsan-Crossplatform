import React, { memo, useCallback, useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { Card, Button } from '~/shared/ui';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';

export interface TradeEmbedProps {
  readonly product: TradeProduct;
  readonly onTradeAccept?: () => Promise<void>;
  readonly onReservation?: () => void;
  readonly showButtons?: boolean;
  readonly isLoading?: boolean;
  readonly requestorNickname?: string;
  readonly alignment?: 'left' | 'right';
}

const TradeEmbedComponent: React.FC<TradeEmbedProps> = ({
  product,
  onTradeAccept,
  onReservation,
  showButtons = false,
  isLoading = false,
  requestorNickname = '상대방',
  alignment = 'left',
}) => {
  const [localLoading, setLocalLoading] = useState(false);

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

  const handleReservation = useCallback(() => {
    console.log('예약예약예약예약예약예약예약예약예약', onReservation);
  }, [onReservation]);

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
            {requestorNickname}님께서 거래하기를 누르셨습니다
          </Text>
          {showButtons && (
            <>
              <View className="flex-row justify-between">
                <Button
                  variant="secondary"
                  onPress={handleReservation}
                  width="w-[48%]"
                  style={{ minHeight: 40 }}>
                  <Text className="text-sm font-medium text-[#8FC31D]">예약하기</Text>
                </Button>

                <Button
                  variant="primary"
                  onPress={handleTradeAccept}
                  disabled={localLoading || isLoading}
                  width="w-[48%]"
                  style={{ minHeight: 40 }}>
                  {localLoading || isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-sm font-medium text-white">거래하기</Text>
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
