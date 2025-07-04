import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '~/shared/ui/Input';
import { TextField } from '~/shared/ui/TextField';
import ImageUploader from '~/entity/product/itemForm/ui/ImageUploader';
import { Button } from '~/shared/ui/Button';

const ItemFormContainer = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1  px-6">
      <View className="flex-1 gap-4">
        <View className="gap-8">
          <Input
            label="주제"
            placeholder="주제를 작성해주세요"
            value={title}
            onChangeText={setTitle}
          />
          <TextField
            label="내용"
            placeholder="내용을 작성해주세요"
            value={content}
            onChangeText={setContent}
          />
        </View>
        <ImageUploader />
      </View>
      <View className="mb-8 mt-12">
        <Button disabled={!isValid}>다음</Button>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ItemFormContainer;
