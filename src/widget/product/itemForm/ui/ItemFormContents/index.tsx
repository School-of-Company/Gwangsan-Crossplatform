import { View } from 'react-native';
import { Input } from '~/shared/ui/Input';
import { TextField } from '~/shared/ui/TextField';
import ImageUploader from '~/entity/product/itemForm/ui/ImageUploader';

interface Props {
  title: string;
  content: string;
  images: string[];
  readonly?: boolean;
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
  onImagesChange?: (images: string[]) => void;
}

const ItemFormContents = ({
  title,
  content,
  images,
  readonly = false,
  onTitleChange,
  onContentChange,
  onImagesChange,
}: Props) => {
  return (
    <View className="px-6">
      <View className="gap-4">
        <View className="gap-8">
          <Input
            label="주제"
            placeholder="주제를 작성해주세요"
            value={title}
            onChangeText={onTitleChange}
            editable={!readonly}
          />
          <TextField
            label="내용"
            placeholder="내용을 작성해주세요"
            value={content}
            onChangeText={onContentChange}
            editable={!readonly}
          />
        </View>
        <ImageUploader images={images} onImagesChange={onImagesChange} readonly={readonly} />
      </View>
    </View>
  );
};

export default ItemFormContents;
