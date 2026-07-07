import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { logger } from '@/shared/lib/logger';
import { Button, Header, Input } from '@/shared/ui';
import { TextField } from '@/shared/ui/TextField';
import ImageUploader from '@/shared/ui/ImageUploader';
import type { ImageUploadState } from '@/shared/ui/ImageUploader';
import { createItemFormRequestBody, useCreateItem } from '~/entity/write/itemForm';
import { getModeLabel, getTypeLabel } from '~/widget/write/model/options';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ProductType } from '~/widget/write/model/type';
import { ModeType } from '~/widget/write/model/mode';
import { useEditPost } from '~/entity/post/model/useEditPost';
import { useGetItem } from '~/entity/post';

const ItemFormPage = () => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');
  const [content, setContent] = useState('');
  const [gwangsan, setGwangsan] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [imageUploadState, setImageUploadState] = useState<ImageUploadState | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const createItemMutation = useCreateItem();
  const {
    id,
    type: typeParam,
    mode: modeParam,
  } = useLocalSearchParams<{ id?: string; type?: string; mode?: string }>();
  const { data: postData, isLoading, error } = useGetItem(id);
  const editPostMutation = useEditPost();

  useEffect(() => {
    if (postData) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setType(postData.type as ProductType);
      setMode(postData.mode as ModeType);
      setTitle(postData.title);
      setContent(postData.content);
      setGwangsan(postData.gwangsan.toString());

      if (postData.images && postData.images.length > 0) {
        const imageUrls = postData.images.map((img) => img.imageUrl);
        const existingImageIds = postData.images.map((img) => img.imageId);
        setImages(imageUrls);
        setImageIds(existingImageIds);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    } else if (!id) {
      setType(typeParam ?? '');
      setMode(modeParam ?? '');
    }
  }, [postData, id, typeParam, modeParam]);

  const mustHaveImage = type === 'OBJECT' && mode === 'GIVER';

  const imagesReady =
    !imageUploadState ||
    (!imageUploadState.hasUploadingImages && !imageUploadState.hasFailedImages);
  const hasAtLeastOneImage = (images?.length ?? 0) > 0 || (imageIds?.length ?? 0) > 0;

  const isFormValid =
    mode.trim().length > 0 &&
    type.trim().length > 0 &&
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    gwangsan.trim().length > 0 &&
    (mustHaveImage ? imagesReady && hasAtLeastOneImage : imagesReady);

  const handleGwangsanChange = useCallback(
    (v: string) => setGwangsan(v.replace(/[^0-9]/g, '')),
    []
  );
  const handleImagesChange = useCallback((v: string[]) => setImages(v), []);
  const handleImageIdsChange = useCallback((ids: number[]) => setImageIds(ids), []);
  const handleImageUploadStateChange = useCallback((state: ImageUploadState) => {
    setImageUploadState(state);
  }, []);
  const handleGwangsanFocus = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  const getButtonText = () => {
    if (isSubmitting) return id ? '수정 중...' : '등록 중...';
    if (imageUploadState?.hasUploadingImages) return '이미지 업로드 중...';
    if (imageUploadState?.hasFailedImages) return '이미지 업로드 실패';
    return id ? '수정하기' : '등록하기';
  };

  const handleSubmit = async () => {
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

      const requestBody = createItemFormRequestBody({
        type,
        mode,
        title,
        content,
        gwangsan,
        images,
        imageIds,
      });

      if (id) {
        const editPayload = { ...requestBody, imageIds: requestBody.imageIds ?? [] };
        await editPostMutation.mutateAsync({ data: editPayload, id });
      } else {
        await createItemMutation.mutateAsync(requestBody);
      }

      router.replace({
        pathname: '/main',
      });
    } catch (error) {
      logger.error('ItemForm submit failed', error);
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

  if (id && (error || !postData)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-error-500">게시글을 불러오는데 실패했습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="게시글" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 250 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View className="gap-6 px-5 pt-6">
            {!!type && !!mode && (
              <Text className="text-sm text-gray-500">
                {getTypeLabel(type)} · {getModeLabel(type, mode)}
              </Text>
            )}
            <ImageUploader
              images={images}
              onImagesChange={handleImagesChange}
              onImageIdsChange={handleImageIdsChange}
              onUploadStateChange={handleImageUploadStateChange}
            />
            <Input
              label="주제"
              placeholder="주제를 작성해주세요"
              value={title}
              onChangeText={setTitle}
            />
            <TextField
              label="내용"
              placeholder="내용을 작성해주세요"
              value={content}
              onChangeText={setContent}
            />
            <Input
              label="광산"
              placeholder="광산을 입력해주세요"
              value={gwangsan}
              onChangeText={handleGwangsanChange}
              onFocus={handleGwangsanFocus}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="bg-white px-5 pt-5">
        <Button onPress={handleSubmit} disabled={!isFormValid || isSubmitting}>
          {getButtonText()}
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default ItemFormPage;
