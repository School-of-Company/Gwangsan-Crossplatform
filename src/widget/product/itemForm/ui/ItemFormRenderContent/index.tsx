import { View } from 'react-native';
import ItemFormContents from '../ItemFormContents';
import ItemFormGwangsan from '../ItemFormGwangsan';
import ItemFormConfirm from '../ItemFormConfirm';
import { memo } from 'react';

interface ItemFormRenderContentProps {
  step: number;
  title: string;
  content: string;
  gwangsan: string;
  images: string[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onImagesChange: (images: string[]) => void;
  onGwangsanChange: (gwangsan: string) => void;
}

const ItemFormRenderContent = ({
  step,
  title,
  content,
  gwangsan,
  images,
  onTitleChange,
  onContentChange,
  onImagesChange,
  onGwangsanChange,
}: ItemFormRenderContentProps) => {
  switch (step) {
    case 1:
      return (
        <View className="pt-12">
          <ItemFormContents
            title={title}
            content={content}
            images={images}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
            onImagesChange={onImagesChange}
          />
        </View>
      );
    case 2:
      return (
        <View className="pt-12">
          <ItemFormGwangsan gwangsan={gwangsan} onGwangsanChange={onGwangsanChange} />
        </View>
      );
    case 3:
      return (
        <View className="pt-5">
          <ItemFormConfirm title={title} content={content} gwangsan={gwangsan} images={images} />
        </View>
      );
    default:
      return null;
  }
};

export default memo(ItemFormRenderContent);
