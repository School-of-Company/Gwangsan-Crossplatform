import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ImageType } from '~/shared/types/imageType';

interface NoticeItemProps {
  id: number;
  title: string;
  place: string;
  content: string;
  createdAt: string;
  role: string;
  images: ImageType[];
}

const NoticeItem = ({ id, title, content, createdAt, images }: NoticeItemProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/notice/${id}`);
  };

  const hasImages = images && images.length > 0;

  return (
    <TouchableOpacity onPress={handlePress} className="mb-3 bg-white p-4" activeOpacity={0.7}>
      <View className="flex-row">
        {hasImages && (
          <View className="mr-3">
            <Image
              source={{ uri: images[0].imageUrl }}
              className="h-16 w-16 rounded-lg"
              resizeMode="cover"
            />
          </View>
        )}

        <View className="flex-1">
          <View className="mb-2 flex-row items-start justify-between">
            <Text className="mr-2 flex-1 text-lg font-semibold text-gray-900">{title}</Text>
            <Text className="text-sm text-gray-500">{createdAt}</Text>
          </View>

          <Text className="text-sm leading-5 text-gray-500" numberOfLines={1} ellipsizeMode="tail">
            {content}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NoticeItem;
