import { View, Text } from 'react-native';
import ItemFormContainer from '../ItemFormContainer';
import ItemFormPointContainer from '../ItemFormPointContainer';

interface Props {
  title: string;
  content: string;
  point: string;
  images: string[];
}

const ItemFormConfirm = ({ title, content, point, images }: Props) => {
  return (
    <View className="flex flex-1 flex-col gap-2">
      <Text className="px-6 text-titleSmall text-black">다시 한번 확인해주세요.</Text>
      <ItemFormContainer title={title} content={content} images={images} readonly={true} />
      <ItemFormPointContainer point={point} readonly={true} />
    </View>
  );
};

export default ItemFormConfirm;
