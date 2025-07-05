import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '~/shared/ui/Input';
import { TextField } from '~/shared/ui/TextField';
import ImageUploader from '~/entity/product/itemForm/ui/ImageUploader';

interface Props {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

const ItemFormContainer = ({ title, content, onTitleChange, onContentChange }: Props) => {
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
            onChangeText={onTitleChange}
          />
          <TextField
            label="내용"
            placeholder="내용을 작성해주세요"
            value={content}
            onChangeText={onContentChange}
          />
        </View>
        <ImageUploader />
      </View>
    </KeyboardAvoidingView>
  );
};

export default ItemFormContainer;
