import { View } from 'react-native';
import { Input } from '~/shared/ui/Input';
import { memo } from 'react';
import ImageUploader, { ImageUploadState } from '~/shared/ui/ImageUploader';
import { ImageType } from '~/shared/types/imageType';

interface Props {
  images: string[];
  initialImages?: ImageType[];
  gwangsan: string;
  readonly?: boolean;
  onGwangsanChange?: (gwangsan: string) => void;
  onImagesChange?: (images: string[]) => void;
  onImageIdsChange?: (imageIds: number[]) => void;
  onImageUploadStateChange?: (state: ImageUploadState) => void;
}

const ItemFormGwangsan = ({
  gwangsan,
  readonly = false,
  onGwangsanChange,
  images,
  initialImages,
  onImageIdsChange,
  onImageUploadStateChange,
  onImagesChange,
}: Props) => {
  return (
    <View className="flex gap-4 px-6">
      <Input
        label="광산"
        placeholder="광산을 입력해주세요"
        value={gwangsan}
        onChangeText={onGwangsanChange}
        editable={!readonly}
        keyboardType="numeric"
      />
      <ImageUploader
        images={images}
        initialImages={initialImages}
        onImagesChange={onImagesChange}
        onImageIdsChange={onImageIdsChange}
        onUploadStateChange={onImageUploadStateChange}
        readonly={readonly}
      />
    </View>
  );
};

export default memo(ItemFormGwangsan);
