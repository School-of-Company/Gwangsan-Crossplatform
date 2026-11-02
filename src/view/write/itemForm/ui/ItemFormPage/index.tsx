import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import { ErrorFallback } from '~/shared/ui/ErrorFallback';
import { AlertModal } from '~/shared/ui/AlertModal';
import { TextField } from '@/shared/ui/TextField';
import ImageUploader from '@/shared/ui/ImageUploader';
import type { ImageUploadState } from '@/shared/ui/ImageUploader';
import {
  createItemFormRequestBody,
  getGwangsanError,
  ITEM_TITLE_MAX_LENGTH,
  useCreateItem,
} from '~/entity/write/itemForm';
import { getModeLabel, getTypeLabel } from '~/widget/write/model/options';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ProductType } from '~/shared/types/type';
import { ModeType } from '~/shared/types/mode';
import { useEditPost } from '~/entity/post/model/useEditPost';
import { useGetItem } from '~/entity/post';
import { useLeaveConfirm } from '../../model/useLeaveConfirm';

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
  const { data: postData, isLoading, error, refetch: refetchPost } = useGetItem(id);
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

  const gwangsanError = getGwangsanError(gwangsan);

  const isFormValid =
    mode.trim().length > 0 &&
    type.trim().length > 0 &&
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    gwangsan.trim().length > 0 &&
    !gwangsanError &&
    (mustHaveImage ? imagesReady && hasAtLeastOneImage : imagesReady);

  // 버튼이 왜 눌리지 않는지 알 수 있도록 첫 번째로 부족한 항목을 버튼 위에 알려준다.
  // 이미지 업로드 중·실패는 버튼 문구로 이미 보여준다.
  const disabledReason = (() => {
    if (isFormValid || isSubmitting || !imagesReady) return null;
    if (mustHaveImage && !hasAtLeastOneImage)
      return '물건 나눔 글에는 사진을 1장 이상 올려 주세요.';
    if (title.trim().length === 0) return '주제를 입력해 주세요.';
    if (content.trim().length === 0) return '내용을 입력해 주세요.';
    if (gwangsan.trim().length === 0) return '광산을 입력해 주세요.';
    return gwangsanError;
  })();

  const isDirty = postData
    ? title !== postData.title ||
      content !== postData.content ||
      gwangsan !== postData.gwangsan.toString() ||
      imageIds.join(',') !== (postData.images ?? []).map((img) => img.imageId).join(',')
    : !id &&
      (title.trim().length > 0 ||
        content.trim().length > 0 ||
        gwangsan.length > 0 ||
        images.length > 0);

  const { isConfirmVisible, confirmLeave, cancelLeave, allowLeave } = useLeaveConfirm(
    isDirty && !isSubmitting
  );

  const initialImages = useMemo(
    () =>
      images
        .map((imageUrl, index) => ({ imageUrl, imageId: imageIds[index] }))
        .filter((img): img is { imageUrl: string; imageId: number } => img.imageId !== undefined),
    [images, imageIds]
  );

  // 숫자와 맨 앞의 '-' 하나만 남긴다 (광산은 음수도 허용)
  const handleGwangsanChange = useCallback(
    (v: string) => setGwangsan(v.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, '')),
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

      allowLeave();
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
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8FC31D" />
      </SafeAreaView>
    );
  }

  if (id && (error || !postData)) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header headerTitle="게시글" />
        <ErrorFallback title="게시글을 불러오는데 실패했습니다." onRetry={() => refetchPost()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header headerTitle="게시글" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              initialImages={initialImages}
              onImagesChange={handleImagesChange}
              onImageIdsChange={handleImageIdsChange}
              onUploadStateChange={handleImageUploadStateChange}
            />
            <Input
              label="주제"
              placeholder="주제를 작성해주세요"
              value={title}
              onChangeText={setTitle}
              maxLength={ITEM_TITLE_MAX_LENGTH}
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
              // iOS 숫자 키패드에는 '-'가 없다
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
            />
            {gwangsanError && (
              <Text testID="gwangsan-error" className="-mt-4 text-sm text-error-500">
                {gwangsanError}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="bg-background px-5 pt-5">
        {disabledReason && (
          <Text
            testID="item-form-disabled-reason"
            className="mb-2 text-center text-sm text-gray-500">
            {disabledReason}
          </Text>
        )}
        <Button onPress={handleSubmit} disabled={!isFormValid || isSubmitting}>
          {getButtonText()}
        </Button>
      </View>

      <AlertModal
        isVisible={isConfirmVisible}
        message={'작성 중인 내용이 있어요.\n저장하지 않고 나가시겠습니까?'}
        cancelText="계속 작성"
        confirmText="나가기"
        destructive
        onCancel={cancelLeave}
        onConfirm={confirmLeave}
      />
    </SafeAreaView>
  );
};

export default ItemFormPage;
