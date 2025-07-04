import { SafeAreaView } from 'react-native-safe-area-context';
import { ItemFormHeader } from '~/entity/product/itemForm';

const ItemFormPage = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ItemFormHeader />
    </SafeAreaView>
  );
};

export default ItemFormPage;
