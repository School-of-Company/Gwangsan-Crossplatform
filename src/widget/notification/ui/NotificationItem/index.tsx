import { View, Text, TouchableOpacity, Image } from 'react-native';
// import { useRouter } from 'expo-router';
import { AlertType } from '~/entity/notification/model/alertTypes';
import { formatDate } from '~/shared/lib/formatDate';

interface NotificationItemProps {
  id: number;
  title: string;
  content: string;
  alertType: AlertType;
  imageIds: number[];
  createdAt: string;
}

const NotificationItem = ({
  // id,
  title,
  content,
  // alertType,
  // imageIds,
  createdAt,
}: NotificationItemProps) => {
  // const router = useRouter();

  // const handlePress = () => {
  //   router.push(`/notification/${id}`);
  // };

  const displayImage = require('~/shared/assets/png/gwangsanLogo.png');

  return (
    <TouchableOpacity className="mb-3 bg-white p-4" activeOpacity={0.7}>
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
    </TouchableOpacity>
  );
};

export default NotificationItem;
