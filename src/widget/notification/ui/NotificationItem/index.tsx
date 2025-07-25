import { View, Text, TouchableOpacity, Image } from 'react-native';
import { AlertType } from '~/entity/notification/model/alertTypes';
import { formatDate } from '~/shared/lib/formatDate';
import { completeTrade } from '~/entity/post/api/completeTrade';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useGetItem } from '~/entity/post/model/useGetItem';
import Toast from 'react-native-toast-message';

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
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAcceptTrade = async () => {
    if (!sendMemberId) return;

    setIsAccepted(true);
    setLoading(true);

    Toast.show({
      type: 'success',
      text1: '거래 완료 수락 완료',
      visibilityTime: 2000,
    });

    try {
      const productId = sourceId;
      if (!productId) {
        throw new Error('productId 정보가 없습니다.');
      }
      await completeTrade({ productId, otherMemberId: sendMemberId });
    } catch (e) {
      setIsAccepted(false);
      Toast.show({
        type: 'error',
        text1: '거래 완료 수락 실패',
        text2: e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.',
        visibilityTime: 3000,
      });
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

  const getButtonText = () => {
    if (isAccepted) return '수락 완료';
    if (loading) return '처리 중...';
    return '거래 완료 수락';
  };

  const getButtonStyle = () => {
    if (isAccepted) return 'bg-gray-400';
    return 'bg-green-500';
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

          {shouldShowAcceptButton && !isAccepted && (
            <TouchableOpacity
              className={`mt-2 rounded px-4 py-2 ${getButtonStyle()}`}
              onPress={handleAcceptTrade}
              disabled={loading || isAccepted}>
              <Text className="font-semibold text-white">{getButtonText()}</Text>
            </TouchableOpacity>
          )}

          {isAccepted && (
            <View className="mt-2 rounded bg-gray-400 px-4 py-2">
              <Text className="font-semibold text-white">수락 완료</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NotificationItem;
