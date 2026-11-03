import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, Text, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Button, Header, ProgressBar } from '~/shared/ui';
import { TextField } from '~/shared/ui/TextField';
import { ChatRoomProductInfo } from '~/widget/chat';
import { useChatRoomData, useChatOtherUser } from '~/entity/chat';
import { useGetItem, createReview } from '~/entity/post';
import { logger } from '~/shared/lib/logger';
import type { RoomId } from '~/shared/types/chatType';
import { reviewKeys } from '~/entity/reviews';

export default function ReviewWritePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id) as RoomId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data: roomData, isError: isRoomDataError } = useChatRoomData({ roomId });
  const otherUserInfo = useChatOtherUser(roomId, roomData?.messages);
  const productId = roomData?.product?.id;
  const { data: productDetail } = useGetItem(productId?.toString());

  const [light, setLight] = useState(60);
  const [contents, setContents] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTradeInfoReady = !!productId && !!otherUserInfo.id;
  const isContentEmpty = contents.trim().length === 0;
  const isDisabled = !isTradeInfoReady || isContentEmpty || isSubmitting;

  // 버튼이 왜 눌리지 않는지 알 수 있도록 비활성 사유를 버튼 위에 보여준다
  const disabledReason = isSubmitting
    ? null
    : !isTradeInfoReady
      ? isRoomDataError
        ? '거래 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
        : '거래 정보를 불러오는 중이에요.'
      : isContentEmpty
        ? '후기 내용을 입력해 주세요.'
        : null;

  const handleSubmit = useCallback(async () => {
    if (!productId || !otherUserInfo.id || isDisabled) return;

    try {
      setIsSubmitting(true);
      await createReview({
        productId,
        otherMemberId: otherUserInfo.id,
        content: contents.trim(),
        light,
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      Toast.show({ type: 'success', text1: '리뷰가 성공적으로 작성되었습니다.' });
      router.back();
    } catch (error) {
      logger.error('리뷰 작성 실패', error);
      Toast.show({
        type: 'error',
        text1: '리뷰 작성 실패',
        text2: '잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [productId, otherUserInfo.id, contents, light, isDisabled, queryClient, router]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header headerTitle="후기 작성" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-8 px-4 py-6">
          {roomData?.product && (
            <ChatRoomProductInfo
              title={productDetail?.title ?? roomData.product.title}
              gwangsan={productDetail?.gwangsan}
              imageUrl={
                productDetail?.images?.[0]?.imageUrl ?? roomData.product.images?.[0]?.imageUrl
              }
            />
          )}
          <ProgressBar value={light} onChange={setLight} />
          <TextField
            label="후기 작성"
            placeholder="거래의 후기를 입력해주세요"
            value={contents}
            onChangeText={setContents}
            multiline
          />
        </View>
      </ScrollView>

      <KeyboardStickyView offset={{ closed: -insets.bottom, opened: 0 }}>
        <View className="bg-background px-5 pb-3 pt-5">
          {disabledReason && (
            <Text
              testID="review-write-disabled-reason"
              className="mb-2 text-center text-sm text-gray-500">
              {disabledReason}
            </Text>
          )}
          <Button disabled={isDisabled} onPress={handleSubmit}>
            {isSubmitting ? '작성 중...' : '작성완료'}
          </Button>
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
