import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createReview } from '~/entity/post/api/createReview';
import { completeTrade } from '~/entity/post/api/completeTrade';
import { useGetItem } from '~/entity/post/model/useGetItem';
import { useDeletePost } from '~/entity/post';
import MiniProfile from '~/entity/post/ui/miniProfile';
import ReportModal from '~/entity/post/ui/ReportModal';
import ReviewsModal from '~/entity/post/ui/ReviewsModal';
import { Button, Header } from '~/shared/ui';
import Toast from 'react-native-toast-message';
import { getData } from '~/shared/lib/getData';
import { useChatNavigation } from '~/shared/lib/useChatNavigation';

export default function PostPageView() {
  const router = useRouter();
  const { id, review } = useLocalSearchParams<{ id: string; review?: string }>();
  const { data, isLoading, error } = useGetItem(id);
  const { deletePost, isLoading: isDeleting } = useDeletePost();

  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(!!review);
  const [reviewLight, setReviewLight] = useState<number>(60);
  const [reviewContents, setReviewContents] = useState('');
  const [isMyPost, setIsMyPost] = useState(false);

  const { navigateToChat, isLoading: isChatLoading } = useChatNavigation();

  const handleReportPress = useCallback(() => {
    setIsReportModalVisible(true);
  }, []);

  const handleReportModalClose = useCallback(() => {
    setIsReportModalVisible(false);
  }, []);

  const handleDeletePress = useCallback(() => {
    if (!data) return;

    Alert.alert('게시글 삭제', '이 게시글을 삭제하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deletePost(data.id, data.type, data.mode);
        },
      },
    ]);
  }, [data, deletePost]);

  const handleCompletePress = useCallback(async () => {
    if (!id || !data) return;

    try {
      await completeTrade({
        productId: data.id,
        otherMemberId: data.member.memberId,
      });
      Toast.show({
        type: 'success',
        text1: '거래가 완료되었습니다.',
      });
      setIsReviewModalVisible(true);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '거래 완료 실패',
        text2: error as string,
      });
    }
  }, [id, data]);

  const handleReviewModalClose = useCallback(() => {
    setIsReviewModalVisible(false);
  }, []);

  const handleReviewAnimationComplete = useCallback(() => {
    setReviewLight(60);
    setReviewContents('');
  }, []);

  const handleReviewSubmit = useCallback(
    async (light: number, contents: string) => {
      if (!id || !data) return;

      try {
        await createReview({
          productId: data.id,
          content: contents,
          light: light,
        });
        Toast.show({
          type: 'success',
          text1: '리뷰가 성공적으로 작성되었습니다.',
        });
        handleReviewModalClose();
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: '리뷰 작성 실패',
          text2: error as string,
        });
      }
    },
    [id, data, handleReviewModalClose]
  );

  const handleReviewLightChange = useCallback((light: number) => {
    setReviewLight(light);
  }, []);

  const handleReviewContentsChange = useCallback((contents: string) => {
    setReviewContents(contents);
  }, []);

  const handleEditPress = useCallback(() => {
    if (id) {
      router.push(`/post/${id}/edit`);
    }
  }, [id, router]);

  const handleChatPress = useCallback(async () => {
    if (data?.id) {
      await navigateToChat(data.id as any);
    }
  }, [data?.id, navigateToChat]);

  const handleReviewButtonPress = useCallback(() => {
    setIsReviewModalVisible(true);
  }, []);

  useEffect(() => {
    const checkIsMyPost = async () => {
      if (data) {
        const memberId = await getData('memberId');
        const currentUserId = Number(memberId);
        const isMyPostResult =
          currentUserId === Number(data.member.memberId) && currentUserId !== 0;
        setIsMyPost(isMyPostResult);
      }
    };
    checkIsMyPost();
  }, [data]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#8FC31D" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-error-500">게시글을 불러오는데 실패했습니다.</Text>
      </SafeAreaView>
    );
  }

  const headerTitle = data.mode === 'RECEIVER' ? '해주세요' : '해드립니다';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle={headerTitle} />
      <ScrollView>
        {data.images && data.images.length > 0 ? (
          <Image
            source={{ uri: data.images[0].imageUrl }}
            className="h-[280px] w-full"
            resizeMode="cover"
          />
        ) : (
          <Image source={require('~/shared/assets/png/logo.png')} className="h-[280px] w-full" />
        )}
        <MiniProfile
          nickname={data.member.nickname}
          placeName={data.member.placeName}
          light={data.member.light}
          memberId={data.member.memberId}
        />
        <View className="gap-6 p-6">
          <Text className="text-titleSmall">{data.title}</Text>
          <Text className="text-body3">{data.gwangsan} 광산</Text>
          <Text>{data.content}</Text>

          <TouchableOpacity
            onPress={isMyPost ? handleDeletePress : handleReportPress}
            disabled={isDeleting}>
            <Text className="mb-24 mt-[25px] text-error-500 underline">
              {isMyPost
                ? isDeleting
                  ? '삭제 처리 중...'
                  : '이 게시글 삭제하기'
                : '이 게시글 신고하기'}
            </Text>
          </TouchableOpacity>

          <View className="w-full flex-row justify-center gap-4">
            {review === '1' ? (
              <Button variant="primary" width="w-full" onPress={handleReviewButtonPress}>
                리뷰 작성
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  width="w-1/2"
                  onPress={handleChatPress}
                  disabled={isChatLoading}>
                  {isChatLoading ? '채팅방 생성 중...' : '채팅하기'}
                </Button>
                {isMyPost ? (
                  <Button variant="primary" width="w-1/2" onPress={handleEditPress}>
                    수정하기
                  </Button>
                ) : (
                  <>
                    {data.isCompleted ? (
                      <Button variant="primary" width="w-1/2" disabled>
                        거래완료됨
                      </Button>
                    ) : data.isCompletable ? (
                      <Button variant="primary" width="w-1/2" onPress={handleCompletePress}>
                        거래완료
                      </Button>
                    ) : (
                      <Button variant="primary" width="w-1/2" disabled>
                        채팅 후 거래완료
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <ReportModal
        sourceId={data?.id || 0}
        isVisible={isReportModalVisible}
        onClose={handleReportModalClose}
      />

      <ReviewsModal
        isVisible={isReviewModalVisible}
        onClose={handleReviewModalClose}
        onSubmit={handleReviewSubmit}
        light={reviewLight}
        setLight={handleReviewLightChange}
        contents={reviewContents}
        onContentsChange={handleReviewContentsChange}
        onAnimationComplete={handleReviewAnimationComplete}
      />
    </SafeAreaView>
  );
}
