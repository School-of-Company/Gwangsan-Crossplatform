import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import ItemFormHeader from '~/entity/product/itemForm/ui/ItemFormHeader';
import ItemFormContainer from '~/widget/product/itemForm/ui/ItemFormContainer';
import ItemFormPointContainer from '~/widget/product/itemForm/ui/ItemFormPointContainer';

const ItemFormPage = () => {
  const [step, setStep] = useState(1);

  let content;
  if (step === 1) {
    content = <ItemFormContainer onNext={() => setStep(2)} />;
  } else if (step === 2) {
    content = <ItemFormPointContainer onNext={() => setStep(3)} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ItemFormHeader step={step} />
      {content}
    </SafeAreaView>
  );
};

export default ItemFormPage;
