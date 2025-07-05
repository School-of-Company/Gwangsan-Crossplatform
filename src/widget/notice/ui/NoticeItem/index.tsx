import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

interface NoticeItemProps {
  id: number;
  title: string;
  place: string;
  content: string;
  createdAt: string;
  role: string;
  images: Array<{
    imageId: number;
    imageUrl: string;
  }>;
}

const NoticeItem = ({ 
  id, 
  title, 
  content, 
  createdAt,
  images
}: NoticeItemProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/notice/${id}`);
  };

  const hasImages = images && images.length > 0;

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className="bg-white p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row">
        {hasImages && (
          <View className="mr-3">
            <Image 
              source={{ uri: images[0].imageUrl }}
              className="w-16 h-16 rounded-lg"
              resizeMode="cover"
            />
          </View>
        )}
        
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-lg font-semibold text-gray-900 flex-1 mr-2">
              {title}
            </Text>
            <Text className="text-sm text-gray-500">
              {createdAt}
            </Text>
          </View>
          
          <Text
            className="text-sm text-gray-500 leading-5"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {content}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NoticeItem;
