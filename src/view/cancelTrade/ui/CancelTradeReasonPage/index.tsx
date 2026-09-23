import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { Button, Header } from '~/shared/ui';
import { TextField } from '~/shared/ui/TextField';
import ImageUploader, { type ImageUploadState } from '~/shared/ui/ImageUploader';
import { useCancelTrade } from '~/widget/cancelTrade/model/useCancelTrade';
import { useGetReview } from '../../model/useGetReview';

export default function CancelTradeReasonPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<string[]>([]);

  // 리뷰 상세는 이전 화면에서 이미 조회돼 캐시에 있으므로 여기서는 productId만 꺼내 쓴다.
  const { data } = useGetReview(id ?? '');

  const handleSuccess = useCallback(() => {
    router.back();
  }, [router]);

  const {
    handleSubmit,
    setReason,
    reason,
    setImageIds,
    setImageUploadState,
    canSubmit,
    isLoading,
    imageUploadState,
  } = useCancelTrade({
    productId: data?.productId,
    onSuccess: handleSuccess,
  });

  const handleFormSubmit = useCallback(() => {
    if (reason.trim()) {
      handleSubmit(reason.trim());
    }
  }, [reason, handleSubmit]);

  const handleImageIdsChange = useCallback(
    (imageIds: number[]) => {
      setImageIds(imageIds);
    },
    [setImageIds]
  );

  const handleUploadStateChange = useCallback(
    (uploadState: ImageUploadState) => {
      setImageUploadState(uploadState);
    },
    [setImageUploadState]
  );

  const isFormDisabled = useMemo(() => !canSubmit || isLoading, [canSubmit, isLoading]);

  const submitButtonText = useMemo(() => {
    if (isLoading) return '거래 취소 처리 중...';
    if (imageUploadState?.hasUploadingImages) return '이미지 업로드 중...';
    if (imageUploadState?.hasFailedImages) return '이미지 업로드 실패';
    return '거래취소하기';
  }, [isLoading, imageUploadState]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="거래취소하기" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-4 py-2">
          <TextField
            label="거래취소사유"
            placeholder="거래취소사유를 입력해주세요"
            value={reason}
            onChangeText={setReason}
            multiline
          />

          <ImageUploader
            images={images}
            title="증빙 이미지"
            onImagesChange={setImages}
            onImageIdsChange={handleImageIdsChange}
            onUploadStateChange={handleUploadStateChange}
          />
        </View>
      </ScrollView>

      <KeyboardStickyView offset={{ closed: -insets.bottom, opened: 0 }}>
        <View className="bg-white px-5 pb-3 pt-5">
          <Button variant="error" disabled={isFormDisabled} onPress={handleFormSubmit}>
            {submitButtonText}
          </Button>
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
