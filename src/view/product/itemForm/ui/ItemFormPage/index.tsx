import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import ItemFormHeader from '~/entity/product/itemForm/ui/ItemFormHeader';
import ItemFormContainer from '~/widget/product/itemForm/ui/ItemFormContainer';
import ItemFormPointContainer from '~/widget/product/itemForm/ui/ItemFormPointContainer';
import { LastStepButton, NextButton } from '~/entity/product/itemForm';
import { ItemFormConfirm } from '~/widget/product/itemForm';

const ItemFormPage = () => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [point, setPoint] = useState('');
  const [images, setImages] = useState<string[]>([]);

  let contentComponent;
  if (step === 1) {
    contentComponent = (
      <ItemFormContainer
        title={title}
        content={content}
        images={images}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onImagesChange={setImages}
      />
    );
  } else if (step === 2) {
    contentComponent = <ItemFormPointContainer point={point} onPointChange={setPoint} />;
  } else if (step === 3) {
    contentComponent = (
      <ItemFormConfirm title={title} content={content} point={point} images={images} />
    );
  }

  const isStep1Valid = title.trim().length > 0 && content.trim().length > 0;
  const isStep2Valid = point.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ItemFormHeader step={step} />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {contentComponent}
          {step === 1 && <NextButton disabled={!isStep1Valid} onPress={() => setStep(2)} />}
          {step === 2 && <NextButton disabled={!isStep2Valid} onPress={() => setStep(3)} />}
          {step === 3 && (
            <LastStepButton
              onEditPress={() => setStep(1)}
              onCompletePress={() => {
                console.log('=== 상품 등록 완료 ===');
                console.log('제목:', title);
                console.log('내용:', content);
                console.log('포인트:', point);
                console.log('이미지:', images);
                console.log('==================');
              }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ItemFormPage;
