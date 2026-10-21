import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { Button, Header } from '~/shared/ui';
import { Dropdown } from '~/shared/ui/Dropdown';
import { TextField } from '~/shared/ui/TextField';
import ImageUploader, { type ImageUploadState } from '~/shared/ui/ImageUploader';
import { FEEDBACK_TYPES, useCreateFeedback, type FeedbackType } from '~/entity/feedback';

const MAX_CONTENT_LENGTH = 1000;

export default function FeedbackPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [imageUploadState, setImageUploadState] = useState<ImageUploadState>();

  const handleSuccess = useCallback(() => {
    router.back();
  }, [router]);

  const { createFeedback, isLoading } = useCreateFeedback(handleSuccess);

  const trimmedContent = content.trim();
  const isUploading = imageUploadState?.hasUploadingImages ?? false;
  const hasUploadFailed = imageUploadState?.hasFailedImages ?? false;
  const canSubmit =
    !!feedbackType && !!trimmedContent && !isUploading && !hasUploadFailed && !isLoading;

  const handleSubmit = useCallback(() => {
    if (!feedbackType || !trimmedContent) return;
    createFeedback({ type: feedbackType, content: trimmedContent, imageIds });
  }, [feedbackType, trimmedContent, imageIds, createFeedback]);

  const submitButtonText = (() => {
    if (isLoading) return '전송 중...';
    if (isUploading) return '이미지 업로드 중...';
    if (hasUploadFailed) return '이미지 업로드 실패';
    return '보내기';
  })();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header headerTitle="문의/의견 보내기" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-4 py-2">
          <Dropdown
            label="문의유형"
            items={FEEDBACK_TYPES}
            placeholder="문의유형을 선택해주세요."
            selectedItem={feedbackType ?? undefined}
            onSelect={setFeedbackType}
          />

          <TextField
            label="내용"
            placeholder="불편했던 점이나 개선 의견을 자유롭게 적어주세요"
            value={content}
            onChangeText={setContent}
            maxLength={MAX_CONTENT_LENGTH}
            multiline
          />

          <ImageUploader
            images={images}
            title="스크린샷"
            onImagesChange={setImages}
            onImageIdsChange={setImageIds}
            onUploadStateChange={setImageUploadState}
          />
        </View>
      </ScrollView>

      <KeyboardStickyView offset={{ closed: -insets.bottom, opened: 0 }}>
        <View className="bg-background px-5 pb-3 pt-5">
          <Button disabled={!canSubmit} onPress={handleSubmit}>
            {submitButtonText}
          </Button>
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
