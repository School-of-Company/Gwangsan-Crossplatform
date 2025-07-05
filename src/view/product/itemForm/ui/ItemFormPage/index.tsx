import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import ItemFormHeader from '~/entity/product/itemForm/ui/ItemFormHeader';
import { LastStepButton, NextButton } from '~/entity/product/itemForm';
import { ItemFormConfirm, ItemFormContents, ItemFormGwangsan } from '~/widget/product/itemForm';

const ItemFormPage = () => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [gwangsan, setGwangsan] = useState('');
  const [images, setImages] = useState<string[]>([]);

  let contentComponent;
  if (step === 1) {
    contentComponent = (
      <View className="pt-12">
        <ItemFormContents
          title={title}
          content={content}
          images={images}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onImagesChange={setImages}
        />
      </View>
    );
  } else if (step === 2) {
    contentComponent = (
      <View className="pt-12">
        <ItemFormGwangsan gwangsan={gwangsan} onGwangsanChange={setGwangsan} />
      </View>
    );
  } else if (step === 3) {
    contentComponent = (
      <View className="pt-5">
        <ItemFormConfirm title={title} content={content} gwangsan={gwangsan} images={images} />
      </View>
    );
  }

  const isStep1Valid = title.trim().length > 0 && content.trim().length > 0;
  const isStep2Valid = gwangsan.trim().length > 0;

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
          <View className="flex-1 flex-col justify-between">
            {contentComponent}
            <View>
              {step === 1 && <NextButton disabled={!isStep1Valid} onPress={() => setStep(2)} />}
              {step === 2 && <NextButton disabled={!isStep2Valid} onPress={() => setStep(3)} />}
              {step === 3 && (
                <LastStepButton
                  onEditPress={() => setStep(1)}
                  onCompletePress={() => {
                    console.log('=== 상품 등록 완료 ===');
                    console.log('제목:', title);
                    console.log('내용:', content);
                    console.log('광산:', gwangsan);
                    console.log('이미지:', images);
                    console.log('==================');
                  }}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ItemFormPage;
