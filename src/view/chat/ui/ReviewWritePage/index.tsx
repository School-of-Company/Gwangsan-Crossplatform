import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Button, Header, ProgressBar } from '~/shared/ui';
import { TextField } from '~/shared/ui/TextField';
import { ChatRoomProductInfo } from '~/widget/chat/ui/ChatRoomProductInfo';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { useChatMessages } from '~/widget/chat/model/useChatMessages';
import { useGetItem } from '~/entity/post';
import { createReview } from '~/entity/post/api/createReview';
import { logger } from '~/shared/lib/logger';
import type { RoomId } from '~/shared/types/chatType';

export default function ReviewWritePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id) as RoomId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data: roomData } = useChatRoomData({ roomId });
  const { otherUserInfo } = useChatMessages({ roomId });
  const productId = roomData?.product?.id;
  const { data: productDetail } = useGetItem(productId?.toString());

  const [light, setLight] = useState(60);
  const [contents, setContents] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = contents.trim().length === 0 || isSubmitting;

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
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
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
        <View className="bg-white px-5 pb-3 pt-5">
          <Button disabled={isDisabled} onPress={handleSubmit}>
            {isSubmitting ? '작성 중...' : '작성완료'}
          </Button>
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
