import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { Button, Header } from '~/shared/ui';
import { Dropdown } from '~/shared/ui/Dropdown';
import { TextField } from '~/shared/ui/TextField';
import ImageUploader, { type ImageUploadState } from '~/shared/ui/ImageUploader';
import { REPORT_TYPES, type ReportType } from '~/entity/post/model/reportType';
import { useReport } from '~/entity/post/model/useReport';

export default function ReportPage() {
  const { productId, memberId } = useLocalSearchParams<{
    productId?: string;
    memberId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<string[]>([]);

  const parsedProductId = productId ? Number(productId) : undefined;
  const parsedMemberId = memberId ? Number(memberId) : undefined;

  const handleSuccess = useCallback(() => {
    router.back();
  }, [router]);

  const {
    reportType,
    contents,
    setReportType,
    setContents,
    setImageIds,
    setImageUploadState,
    handleSubmit,
    canSubmit,
    isLoading,
    imageUploadState,
  } = useReport({
    productId: parsedProductId,
    memberId: parsedMemberId,
    onSuccess: handleSuccess,
  });

  const handleFormSubmit = useCallback(() => {
    if (reportType && contents.trim()) {
      handleSubmit(reportType, contents.trim());
    }
  }, [reportType, contents, handleSubmit]);

  const handleDropdownSelect = useCallback(
    (value: ReportType) => {
      setReportType(value);
    },
    [setReportType]
  );

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
    if (isLoading) return '신고 처리 중...';
    if (imageUploadState?.hasUploadingImages) return '이미지 업로드 중...';
    if (imageUploadState?.hasFailedImages) return '이미지 업로드 실패';
    return '신고하기';
  }, [isLoading, imageUploadState]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="신고하기" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-4 py-2">
          <Dropdown
            label="신고유형"
            items={REPORT_TYPES}
            placeholder="신고유형을 선택해주세요."
            selectedItem={reportType ?? undefined}
            onSelect={handleDropdownSelect}
          />

          <TextField
            label="신고사유"
            placeholder="신고사유를 입력해주세요"
            value={contents}
            onChangeText={setContents}
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
