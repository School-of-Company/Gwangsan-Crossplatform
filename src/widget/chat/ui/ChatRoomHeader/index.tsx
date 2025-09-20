import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TradeEmbed } from '~/entity/chat';
import type { TradeProduct } from '~/entity/chat/model/chatTypes';

interface ChatRoomHeaderProps {
  readonly otherUserNickname: string;
  readonly otherUserId?: number;
  readonly lastMessageDate: string;
  readonly tradeEmbedConfig: {
    readonly shouldShow: boolean;
    readonly product?: TradeProduct | null;
    readonly onTradeRequest?: () => Promise<void>;
    readonly showButtons: boolean;
    readonly isLoading: boolean;
    readonly requestorNickname: string;
  };
  readonly onProfilePress: () => void;
}

export const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  otherUserNickname,
  otherUserId,
  lastMessageDate,
  tradeEmbedConfig,
  onProfilePress,
}) => {
  return (
    <View className="bg-white">
      <View className="items-center py-8">
        <TouchableOpacity onPress={onProfilePress} disabled={!otherUserId}>
          <Text className="mb-2 text-xl font-bold text-gray-900">{otherUserNickname}</Text>
        </TouchableOpacity>
        <Text className="text-sm text-gray-500">{lastMessageDate}</Text>
      </View>
      
      {tradeEmbedConfig.shouldShow && tradeEmbedConfig.product && (
        <View className="px-4 pb-4">
          <TradeEmbed
            product={tradeEmbedConfig.product}
            onTradeRequest={tradeEmbedConfig.onTradeRequest}
            showButtons={tradeEmbedConfig.showButtons}
            isLoading={tradeEmbedConfig.isLoading}
            requestorNickname={tradeEmbedConfig.requestorNickname}
            alignment="left"
          />
        </View>
      )}
    </View>
  );
};
