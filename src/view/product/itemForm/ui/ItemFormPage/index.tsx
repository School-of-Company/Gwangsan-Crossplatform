import { useState, useCallback } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Header } from '@/shared/ui';
import { ItemFormProgressBar } from '~/entity/product/itemForm';
import {
  createItemFormRequestBody,
  itemFormSchema,
} from '~/entity/product/itemForm/model/itemFormSchema';
import { ItemFormRenderContent, ItemFormRenderButton } from '~/widget/product/itemForm';
import { SafeAreaView } from 'react-native-safe-area-context';

const ItemFormPage = ({
  type,
  mode,
  headerTitle,
}: {
  type: string;
  mode: string;
  headerTitle: string;
}) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [gwangsan, setGwangsan] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const isStep1Valid = title.trim().length > 0 && content.trim().length > 0;
  const isStep2Valid = gwangsan.trim().length > 0;

  const handleTitleChange = useCallback((v: string) => setTitle(v), []);
  const handleContentChange = useCallback((v: string) => setContent(v), []);
  const handleGwangsanChange = useCallback(
    (v: string) => setGwangsan(v.replace(/[^0-9]/g, '')),
    []
  );
  const handleImagesChange = useCallback((v: string[]) => setImages(v), []);

  const handleCompletePress = async () => {
    try {
      const formData = {
        type,
        mode,
        title,
        content,
        gwangsan,
        images,
      };

      const validatedData = itemFormSchema.parse({
        type,
        mode,
        title,
        content,
        gwangsan: parseInt(gwangsan, 10),
        imageIds: images.length > 0 ? [] : undefined,
      });

      const requestBody = createItemFormRequestBody(formData);

      console.log('=== 상품 등록 완료 ===');
      console.log('검증된 데이터:', validatedData);
      console.log('요청 body:', requestBody);
      console.log('==================');
    } catch (error) {
      console.error('폼 검증 오류:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white">
        <Header headerTitle={headerTitle} />
        <ItemFormProgressBar step={step} />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View className="flex-1 flex-col justify-between">
            <ItemFormRenderContent
              step={step}
              title={title}
              content={content}
              gwangsan={gwangsan}
              images={images}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              onImagesChange={handleImagesChange}
              onGwangsanChange={handleGwangsanChange}
            />
            <View>
              <ItemFormRenderButton
                step={step}
                isStep1Valid={isStep1Valid}
                isStep2Valid={isStep2Valid}
                onNextStep={setStep}
                onEditPress={() => setStep(1)}
                onCompletePress={handleCompletePress}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ItemFormPage;
