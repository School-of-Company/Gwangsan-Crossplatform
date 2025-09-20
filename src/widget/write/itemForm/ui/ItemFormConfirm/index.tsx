import { View, Text } from 'react-native';
import ItemFormContents from '../ItemFormContents';
import ItemFormGwangsan from '../ItemFormGwangsan';
import { memo } from 'react';
import { ProductType } from '~/widget/write/model/type';
import { ModeType } from '~/widget/write/model/mode';

interface Props {
  title: string;
  content: string;
  gwangsan: string;
  mode: ModeType;
  type: ProductType;
  images: string[];
}

const ItemFormConfirm = ({ title, content, gwangsan, images, mode, type }: Props) => {
  return (
    <View className="flex flex-col gap-7">
      <Text className="px-6 text-titleSmall text-black">다시 한번 확인해주세요.</Text>
      <View className="flex flex-col gap-10">
        <ItemFormContents type={type} mode={mode} title={title} content={content} readonly={true} />
        <ItemFormGwangsan images={images} gwangsan={gwangsan} readonly={true} />
      </View>
    </View>
  );
};

export default memo(ItemFormConfirm);
