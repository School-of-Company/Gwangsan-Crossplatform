import { View, Text, TouchableOpacity } from 'react-native';
import { CachedImage } from '~/shared/ui/CachedImage';
import { AlertType } from '~/entity/notification/model/alertTypes';
import { useChatEntry } from '~/entity/chat/model/useChatEntry';
import { formatDate } from '~/shared/lib/formatDate';
import { resolveNotificationAction } from '~/shared/lib/notificationRouting';
import { useRouter } from 'expo-router';

interface NotificationItemProps {
  id?: number;
  title: string;
  content: string;
  alertType: AlertType;
  images: { imageId: number; imageUrl: string }[];
  createdAt: string;
  sourceId: number;
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
  const { navigateToChat, navigateToRoom } = useChatEntry();

  // 푸시 알림을 눌렀을 때와 같은 규칙으로 이동할 곳을 정한다.
  const action = resolveNotificationAction({ alertType, sourceId: sourceId || undefined });

  const handlePress = () => {
    switch (action.type) {
      case 'chatEntry':
        navigateToChat(action.productId);
        break;
      case 'room':
        navigateToRoom(action.roomId);
        break;
      case 'push':
        router.push(action.href);
        break;
      case 'none':
        break;
    }
  };

  // 이동할 곳이 없는 알림은 카드를 터치 대상으로 만들지 않는다.
  const isPressable = action.type !== 'none';

  const body = (
    <View className="flex-row">
      <View className="mr-3">
        <CachedImage
          source={displayImage}
          className="h-16 w-16 rounded-lg"
          accessible
          accessibilityLabel="광산 알림 아이콘"
        />
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
  );

  return isPressable ? (
    <TouchableOpacity className="mb-3 bg-background p-4" activeOpacity={0.7} onPress={handlePress}>
      {body}
    </TouchableOpacity>
  ) : (
    <View className="mb-3 bg-background p-4">{body}</View>
  );
};

export default NotificationItem;
