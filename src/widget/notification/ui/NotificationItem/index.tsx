import { View, Text, TouchableOpacity, Image } from 'react-native';
import { AlertType } from '~/entity/notification/model/alertTypes';
import { formatDate } from '~/shared/lib/formatDate';
import { useRouter } from 'expo-router';

interface NotificationItemProps {
  id?: number;
  title: string;
  content: string;
  alertType: AlertType;
  images: { imageId: number; imageUrl: string }[];
  createdAt: string;
  sourceId: number;
  raw?: any;
}

const NotificationItem = ({
  title,
  content,
  createdAt,
  sourceId,
  alertType,
}: NotificationItemProps) => {
  const displayImage = require('~/shared/assets/png/gwangsanLogo.png');
  const router = useRouter();

  // 이동할 곳이 없는 알림은 카드를 터치 대상으로 만들지 않는다.
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
        </View>
      </View>
    </Card>
  );
};

export default NotificationItem;
