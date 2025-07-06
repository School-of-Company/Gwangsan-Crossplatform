import { View, TouchableOpacity, Image, Alert, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { memo } from 'react';

interface Props {
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  readonly?: boolean;
}

const ImageUploader = ({ images = [], onImagesChange, readonly = false }: Props) => {
  const pickImage = async () => {
    if (readonly) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진첩 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = [...images, result.assets[0].uri];
      onImagesChange?.(newImages);
    }
  };

  const removeImage = (index: number) => {
    if (readonly) return;

    Alert.alert('이미지 삭제', '이 이미지를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          const newImages = images.filter((_, i) => i !== index);
          onImagesChange?.(newImages);
        },
      },
    ]);
  };

  return (
    <View>
      <Text className="mb-2 text-lg text-black">사진첨부</Text>
      <View className="flex-row flex-wrap items-center gap-3">
        {images.map((uri, idx) => (
          <TouchableOpacity key={idx} onLongPress={() => removeImage(idx)} disabled={readonly}>
            <Image source={{ uri }} className="h-12 w-12 rounded-full" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={pickImage}
          disabled={readonly}
          className="h-12 w-12 items-center justify-center rounded-full bg-gray-50">
          <Icon name="add" size={24} color={readonly ? '#999' : '#111'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(ImageUploader);
