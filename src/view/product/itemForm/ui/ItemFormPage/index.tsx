import { SafeAreaView } from 'react-native-safe-area-context';
import { ItemFormHeader } from '~/entity/product/itemForm';
import { ItemFormContainer } from '~/widget/product/itemForm';
import { Dimensions, View } from 'react-native';

const ItemFormPage = () => {
  const { height } = Dimensions.get('window');

  const getSpacing = () => {
    if (height < 700) return 24;
    if (height < 900) return 32;
    return 48;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ItemFormHeader />
      <View style={{ height: getSpacing() }} />
      <ItemFormContainer />
    </SafeAreaView>
  );
};
export default ItemFormPage;
