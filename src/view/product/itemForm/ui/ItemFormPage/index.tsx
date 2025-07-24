import { useState, useCallback } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Header } from '@/shared/ui';
import {
  ItemFormProgressBar,
  createItemFormRequestBody,
  useCreateItem,
} from '~/entity/product/itemForm';
import { ItemFormRenderContent, ItemFormRenderButton } from '~/widget/product/itemForm';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { ImageUploadState } from '@/shared/ui/ImageUploader';
import Toast from 'react-native-toast-message';

interface ItemFormPageProps {
  type: string;
  mode: string;
  headerTitle: string;
}

const ItemFormPage = ({ type, mode, headerTitle }: ItemFormPageProps) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [gwangsan, setGwangsan] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [imageUploadState, setImageUploadState] = useState<ImageUploadState | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createItemMutation = useCreateItem();

  const isStep1Valid =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    !imageUploadState?.hasUploadingImages &&
    !imageUploadState?.hasFailedImages;
  const isStep2Valid = gwangsan.trim().length > 0;

  const handleTitleChange = useCallback((v: string) => setTitle(v), []);
  const handleContentChange = useCallback((v: string) => setContent(v), []);
  const handleGwangsanChange = useCallback(
    (v: string) => setGwangsan(v.replace(/[^0-9]/g, '')),
    []
  );
  const handleImagesChange = useCallback((v: string[]) => setImages(v), []);
  const handleImageIdsChange = useCallback((ids: number[]) => setImageIds(ids), []);
  const handleImageUploadStateChange = useCallback((state: ImageUploadState) => {
    setImageUploadState(state);
  }, []);

  const handleCompletePress = async () => {
    try {
      if (isSubmitting) return;

      if (imageUploadState?.hasUploadingImages) {
        Toast.show({
          type: 'error',
          text1: '이미지 업로드가 완료될 때까지 기다려주세요.',
          visibilityTime: 3000,
        });
        return;
      }

      if (imageUploadState?.hasFailedImages) {
        Toast.show({
          type: 'error',
          text1: '이미지 업로드 실패',
          visibilityTime: 3000,
        });
        return;
      }

      setIsSubmitting(true);

      const formData = {
        type,
        mode,
        title,
        content,
        gwangsan,
        images,
      };

      const requestBody = createItemFormRequestBody({
        ...formData,
        imageIds,
      });

      await createItemMutation.mutateAsync(requestBody);

      router.replace({
        pathname: '/post',
        params: { type },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
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
              onImageIdsChange={handleImageIdsChange}
              onImageUploadStateChange={handleImageUploadStateChange}
            />
            <View>
              <ItemFormRenderButton
                step={step}
                isStep1Valid={isStep1Valid}
                isStep2Valid={isStep2Valid}
                onNextStep={setStep}
                onEditPress={() => setStep(1)}
                onCompletePress={handleCompletePress}
                isSubmitting={isSubmitting}
                imageUploadState={imageUploadState}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ItemFormPage;
