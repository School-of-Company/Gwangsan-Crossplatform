import { View, Text } from 'react-native';
import ItemFormContents from '../ItemFormContents';
import ItemFormGwangsan from '../ItemFormGwangsan';
import { memo } from 'react';

interface Props {
  title: string;
  content: string;
  gwangsan: string;
  images: string[];
}

const ItemFormConfirm = ({ title, content, gwangsan, images }: Props) => {
  return (
    <View className="flex flex-col gap-7">
      <Text className="px-6 text-titleSmall text-black">다시 한번 확인해주세요.</Text>
      <View className="flex flex-col gap-10">
        <ItemFormContents title={title} content={content} images={images} readonly={true} />
        <ItemFormGwangsan gwangsan={gwangsan} readonly={true} />
      </View>
    </View>
  );
};

export default memo(ItemFormConfirm);
