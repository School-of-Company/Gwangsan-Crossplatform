import React, { memo, useCallback, useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { Card, Button } from '~/shared/ui';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';

export interface TradeEmbedProps {
  readonly product: TradeProduct;
  readonly onTradeRequest?: () => Promise<void>;
  readonly showButtons?: boolean;
  readonly isLoading?: boolean;
  readonly requestorNickname?: string;
  readonly alignment?: 'left' | 'right';
}

const TradeEmbedComponent: React.FC<TradeEmbedProps> = ({
  product,
  onTradeRequest,
  showButtons = false,
  isLoading = false,
  requestorNickname = '상대방',
  alignment = 'left',
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  const handleTradeRequest = useCallback(async () => {
    if (!onTradeRequest || localLoading || isLoading) return;

    try {
      setLocalLoading(true);
      await onTradeRequest();
    } catch (error) {
      console.error('거래 신청 실패:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [onTradeRequest, localLoading, isLoading]);

  const getStatusMessage = (): string => {
    if (product.isCompleted) return '거래가 완료되었습니다!';
    if (showButtons && product.isCompletable) return `${requestorNickname}님과 거래를 진행하세요`;
    return '거래 가능한 상품입니다.';
  };

  const getStatusColor = (): string => {
    if (product.isCompleted) return 'text-green-600';
    if (product.isCompletable) return 'text-blue-600';
    return 'text-gray-600';
  };

  const productImage = product.images[0];
  const hasImage = productImage?.imageUrl;

  const alignmentClass = alignment === 'right' ? 'self-end' : 'self-start';

  return (
    <View className={`mb-4 max-w-[320px] ${alignmentClass}`}>
      <Card variant="primary" padding="none">
        <View className="flex-row p-3">
          <View className="mr-3">
            {hasImage ? (
              <Image
                source={{ uri: productImage.imageUrl }}
                className="h-16 w-16 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
                <Text className="text-gray-400">이미지</Text>
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="mb-1 text-base font-semibold text-gray-900" numberOfLines={1}>
              {product.title}
            </Text>
            <Text className={`text-sm ${getStatusColor()}`} numberOfLines={2}>
              {getStatusMessage()}
            </Text>

            {showButtons && product.isCompletable && !product.isCompleted && (
              <View className="mt-3">
                <Button
                  variant="primary"
                  onPress={handleTradeRequest}
                  disabled={localLoading || isLoading}
                  className="h-8 w-full">
                  {localLoading || isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-xs text-white">거래하기</Text>
                  )}
                </Button>
              </View>
            )}

            {product.isCompleted && (
              <View className="mt-2">
                <View className="rounded bg-green-100 px-2 py-1">
                  <Text className="text-xs font-medium text-green-700">거래 완료</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Card>
    </View>
  );
};

export const TradeEmbed = memo(TradeEmbedComponent);
TradeEmbed.displayName = 'TradeEmbed';
