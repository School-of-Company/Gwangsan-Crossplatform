import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Alert, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

const ImageUploader = () => {
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async () => {
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
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    Alert.alert('이미지 삭제', '이 이미지를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setImages(images.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  return (
    <View>
      <Text className="mb-2 text-lg text-black">사진첨부</Text>
      <View className="flex-row flex-wrap items-center gap-3">
        {images.map((uri, idx) => (
          <TouchableOpacity key={idx} onLongPress={() => removeImage(idx)}>
            <Image source={{ uri }} className="h-12 w-12 rounded-full" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={pickImage}
          className="h-12 w-12 items-center justify-center rounded-full bg-gray-50">
          <Icon name="add" size={24} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ImageUploader;
