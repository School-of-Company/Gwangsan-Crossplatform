import { View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { memo } from 'react';
import Icon from '@expo/vector-icons/Ionicons';
import type { ImagePreview as ImagePreviewType } from '../../model/useChatInput';

interface ImagePreviewProps {
  images: ImagePreviewType[];
  onRemoveImage: (imageId: number) => void;
}

const ImagePreviewComponent = ({ images, onRemoveImage }: ImagePreviewProps) => {
  if (images.length === 0) return null;

  return (
    <View className="border-t border-gray-200 bg-gray-50 px-4 py-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-2">
          {images.map((image, index) => (
            <View key={image.imageId} className="relative">
              <Image
                source={{ uri: image.localUri }}
                className="h-16 w-16 rounded-lg"
                resizeMode="cover"
                accessibilityLabel={`첨부할 사진 ${index + 1}`}
              />
              <TouchableOpacity
                className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-red-500"
                onPress={() => onRemoveImage(image.imageId)}
                accessibilityRole="button"
                accessibilityLabel={`사진 ${index + 1} 첨부 취소`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={12} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export const ImagePreview = memo(ImagePreviewComponent);
