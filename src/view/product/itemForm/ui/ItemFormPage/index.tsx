import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import ItemFormHeader from '~/entity/product/itemForm/ui/ItemFormHeader';
import ItemFormContainer from '~/widget/product/itemForm/ui/ItemFormContainer';
import ItemFormPointContainer from '~/widget/product/itemForm/ui/ItemFormPointContainer';
import { NextButton } from '~/entity/product/itemForm';

const ItemFormPage = () => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [point, setPoint] = useState('');

  let contentComponent;
  if (step === 1) {
    contentComponent = (
      <ItemFormContainer
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
      />
    );
  } else if (step === 2) {
    contentComponent = <ItemFormPointContainer point={point} onPointChange={setPoint} />;
  }

  const isStep1Valid = title.trim().length > 0 && content.trim().length > 0;
  const isStep2Valid = point.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ItemFormHeader step={step} />
      {contentComponent}
      {step === 1 && <NextButton disabled={!isStep1Valid} onPress={() => setStep(2)} />}
      {step === 2 && <NextButton disabled={!isStep2Valid} onPress={() => setStep(3)} />}
    </SafeAreaView>
  );
};

export default ItemFormPage;
