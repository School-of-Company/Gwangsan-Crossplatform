import { View, Text, TouchableOpacity, Image } from 'react-native';
import { AlertType } from '~/entity/notification/model/alertTypes';
import { formatDate } from '~/shared/lib/formatDate';
import { completeTrade } from '~/entity/post/api/completeTrade';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useGetItem } from '~/entity/post/model/useGetItem';

interface NotificationItemProps {
  id: number;
  title: string;
  content: string;
  alertType: AlertType;
  imageIds: number[];
  createdAt: string;
  sendMemberId?: number | null;
  sourceId?: number | null;
  images?: { imageId: number; imageUrl: string }[];
  raw?: any;
}

const NotificationItem = ({
  title,
  content,
  createdAt,
  sendMemberId,
  sourceId,
  alertType,
  raw,
}: NotificationItemProps) => {
  const displayImage = require('~/shared/assets/png/gwangsanLogo.png');
  const router = useRouter();

  const shouldFetchPost = alertType === AlertType.OTHER_MEMBER_TRADE_COMPLETE && sourceId;
  const { data: postData } = useGetItem(shouldFetchPost ? sourceId.toString() : undefined);

  const shouldShowAcceptButton = 
    alertType === AlertType.OTHER_MEMBER_TRADE_COMPLETE && 
    sendMemberId && 
    postData?.isCompletable === true && 
    postData?.isCompleted === false;

  const [loading, setLoading] = useState(false);
  const handleAcceptTrade = async () => {
    if (!sendMemberId) return;
    setLoading(true);
    try {
      const productId = sourceId;
      if (!productId) {
        alert('productId 정보가 없습니다.');
        setLoading(false);
        return;
      }
      await completeTrade({ productId, otherMemberId: sendMemberId });
      alert('거래 완료를 수락했습니다.');
    } catch (e) {
      alert(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (alertType === AlertType.TRADE_COMPLETE && sourceId) {
      router.push(`/post/${sourceId}?review=1`);
      return;
    }
  };

  return (
    <TouchableOpacity className="mb-3 bg-white p-4" activeOpacity={0.7} onPress={handlePress}>
      <View className="flex-row">
        <View className="mr-3">
          <Image source={displayImage} className="h-16 w-16 rounded-lg" resizeMode="cover" />
        </View>

        <View className="flex-1">
          <View className="mb-2 flex-row items-start justify-between">
            <Text className="mr-2 flex-1 text-lg font-semibold text-gray-900">{title}</Text>
            <Text className="text-sm text-gray-500">{formatDate(createdAt)}</Text>
          </View>

          <Text className="text-sm leading-5 text-gray-500" numberOfLines={1} ellipsizeMode="tail">
            {content}
          </Text>

          {shouldShowAcceptButton && (
            <TouchableOpacity
              className="mt-2 rounded bg-green-500 px-4 py-2"
              onPress={handleAcceptTrade}
              disabled={loading}>
              <Text className="font-semibold text-white">
                {loading ? '처리 중...' : '거래 완료 수락'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NotificationItem;
