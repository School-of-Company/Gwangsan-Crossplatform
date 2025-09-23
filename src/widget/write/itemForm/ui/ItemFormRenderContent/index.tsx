import { View } from 'react-native';
import ItemFormContents from '../ItemFormContents';
import ItemFormGwangsan from '../ItemFormGwangsan';
import ItemFormConfirm from '../ItemFormConfirm';
import { memo } from 'react';
import type { ImageUploadState } from '@/shared/ui/ImageUploader';
import { ProductType } from '~/widget/write/model/type';
import { ModeType } from '~/widget/write/model/mode';

interface ItemFormRenderContentProps {
  step: number;
  title: string;
  content: string;
  gwangsan: string;
  images: string[];
  mode: ModeType;
  type: ProductType;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onModeChange: (mode: ModeType) => void;
  onTypeChange: (mode: ProductType) => void;
  onImagesChange: (images: string[]) => void;
  onGwangsanChange: (gwangsan: string) => void;
  onImageIdsChange?: (imageIds: number[]) => void;
  onImageUploadStateChange?: (state: ImageUploadState) => void;
}

const ItemFormRenderContent = ({
  step,
  title,
  content,
  gwangsan,
  images,
  mode,
  type,
  onTitleChange,
  onContentChange,
  onImagesChange,
  onGwangsanChange,
  onImageIdsChange,
  onImageUploadStateChange,
  onModeChange,
  onTypeChange,
}: ItemFormRenderContentProps) => {
  switch (step) {
    case 1:
      return (
        <View className="pt-12">
          <ItemFormContents
            title={title}
            content={content}
            mode={mode}
            type={type}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
            onModeChange={onModeChange}
            onTypeChange={onTypeChange}
          />
        </View>
      );
    case 2:
      return (
        <View className="pt-12">
          <ItemFormGwangsan
            images={images}
            onImageUploadStateChange={onImageUploadStateChange}
            onImagesChange={onImagesChange}
            onImageIdsChange={onImageIdsChange}
            gwangsan={gwangsan}
            onGwangsanChange={onGwangsanChange}
          />
        </View>
      );
    case 3:
      return (
        <View className="pt-5">
          <ItemFormConfirm
            mode={mode}
            type={type}
            title={title}
            content={content}
            gwangsan={gwangsan}
            images={images}
          />
        </View>
      );
    default:
      return null;
  }
};

export default memo(ItemFormRenderContent);
