import { View, Text, TouchableOpacity, Image } from 'react-native';
import { AlertType } from '~/entity/notification/model/alertTypes';
import { formatDate } from '~/shared/lib/formatDate';
import { requestTrade } from '~/entity/post/api/requestTrade';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useGetItem } from '~/entity/post/model/useGetItem';
import Toast from 'react-native-toast-message';

interface NotificationItemProps {
  id?: number;
  title: string;
  content: string;
  alertType: AlertType;
  images: { imageId: number; imageUrl: string }[];
  createdAt: string;
  sendMemberId: number;
  sourceId: number;
  raw?: any;
}

const NotificationItem = ({
  title,
  content,
  createdAt,
  sendMemberId,
  sourceId,
  alertType,
}: NotificationItemProps) => {
  const displayImage = require('~/shared/assets/png/gwangsanLogo.png');
  const router = useRouter();
  const queryClient = useQueryClient();

  const shouldFetchPost = alertType === AlertType.OTHER_MEMBER_TRADE_COMPLETE && sourceId;
  const { data: postData } = useGetItem(shouldFetchPost ? sourceId.toString() : undefined);

  const shouldShowAcceptButton =
    alertType === AlertType.OTHER_MEMBER_TRADE_COMPLETE &&
    postData?.isCompletable === true &&
    postData?.isCompleted === false;

  const [loading, setLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAcceptTrade = async () => {
    setLoading(true);

    try {
      await requestTrade({ productId: sourceId, otherMemberId: sendMemberId });
      setIsAccepted(true);

      Toast.show({
        type: 'success',
        text1: '거래 완료 수락 완료',
        visibilityTime: 2000,
      });

      queryClient.invalidateQueries({ queryKey: ['post', sourceId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['alertList'] });
    } catch (e) {
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

  // 이동할 곳이 없는 알림(예: 거래 완료 수락 대기)은 카드를 터치 대상으로 만들지 않는다.
  // 카드가 TouchableOpacity면 Android에서 내부 수락 버튼의 터치를 가로챈다.
  const pressRoute =
    sourceId && alertType === AlertType.TRADE_COMPLETE
      ? `/post/${sourceId}?review=1`
      : sourceId && alertType === AlertType.REVIEW
        ? `/cancelTrade/${sourceId}`
        : null;

  const Card: React.ComponentType<any> = pressRoute ? TouchableOpacity : View;
  const cardProps = pressRoute
    ? { activeOpacity: 0.7, onPress: () => router.push(pressRoute) }
    : {};

  const getButtonText = () => {
    if (loading) return '처리 중...';
    return '거래 완료 수락';
  };

  return (
    <Card className="mb-3 bg-white p-4" {...cardProps}>
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
              className="mt-2 rounded bg-green-500 px-4 py-2"
              onPress={handleAcceptTrade}
              disabled={loading}>
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
    </Card>
  );
};

export default NotificationItem;
