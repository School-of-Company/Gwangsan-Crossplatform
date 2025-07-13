import { useState, useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '~/shared/ui';
import { ItemFormProgressBar } from '~/entity/product/itemForm';
import { ItemFormRenderContent, ItemFormRenderButton } from '~/widget/product/itemForm';
import { useGetItem } from '~/entity/post/model/useGetItem';
import { useEditPost } from '~/entity/post/model/useEditPost';
import Toast from 'react-native-toast-message';

const PostEditPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: postData, isLoading, error } = useGetItem(id);
  const editPostMutation = useEditPost();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [gwangsan, setGwangsan] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (postData) {
      setTitle(postData.title);
      setContent(postData.content);
      setGwangsan(postData.gwangsan.toString());

      if (postData.images && postData.images.length > 0) {
        const imageUrls = postData.images.map((img) => img.imageUrl);
        const existingImageIds = postData.images.map((img) => img.imageId);
        setImages(imageUrls);
        setImageIds(existingImageIds);
      }
    }
  }, [postData]);

  const isStep1Valid = title.trim().length > 0 && content.trim().length > 0;
  const isStep2Valid = gwangsan.trim().length > 0;

  const handleTitleChange = useCallback((v: string) => setTitle(v), []);
  const handleContentChange = useCallback((v: string) => setContent(v), []);
  const handleGwangsanChange = useCallback(
    (v: string) => setGwangsan(v.replace(/[^0-9]/g, '')),
    []
  );
  const handleImagesChange = useCallback((v: string[]) => setImages(v), []);
  const handleImageIdsChange = useCallback((ids: number[]) => setImageIds(ids), []);

  const handleCompletePress = async () => {
    if (!id || !postData) return;

    try {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const editData = {
        type: postData.type,
        mode: postData.mode,
        title,
        content,
        gwangsan: parseInt(gwangsan),
        imageIds,
      };

      await editPostMutation.mutateAsync({ id, data: editData });

      Toast.show({
        type: 'success',
        text1: '게시글이 성공적으로 수정되었습니다.',
      });

      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '게시글 수정 실패',
        text2: error as string,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#8FC31D" />
      </SafeAreaView>
    );
  }

  if (error || !postData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-error-500">게시글을 불러오는데 실패했습니다.</Text>
      </SafeAreaView>
    );
  }

  const headerTitle = postData.mode === 'RECEIVER' ? '해주세요 수정' : '해드립니다 수정';

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
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PostEditPage;
