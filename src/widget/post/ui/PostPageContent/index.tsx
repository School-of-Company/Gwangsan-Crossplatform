import React, { useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import MiniProfile from '~/entity/post/ui/miniProfile';
import { Button, SlideIndicator } from '~/shared/ui';
import type { PostDetailResponse } from '~/entity/post/api/getItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostPageContentProps {
  readonly data: PostDetailResponse;
  readonly isMyPost: boolean;
  readonly isDeleting: boolean;
  readonly isChatLoading: boolean;
  readonly isTradeRequestLoading: boolean;
  readonly refreshing: boolean;
  readonly review?: string;
  readonly computedValues: {
    readonly canTrade: boolean;
    readonly isTradeButtonDisabled: boolean;
    readonly tradeButtonText: string;
  };
  readonly onDeletePress: () => void;
  readonly onReportPress: () => void;
  readonly onEditPress: () => void;
  readonly onChatPress: () => void;
  readonly onTradeRequest: () => void;
  readonly onReviewButtonPress: () => void;
  readonly onRefresh: () => void;
}

export const PostPageContent: React.FC<PostPageContentProps> = ({
  data,
  isMyPost,
  isDeleting,
  isChatLoading,
  refreshing,
  review,
  onDeletePress,
  onReportPress,
  onEditPress,
  onChatPress,
  onReviewButtonPress,
  onRefresh,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef<ScrollView>(null);

  const handleImageIndicatorPress = (index: number) => {
    imageScrollRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true });
    setCurrentImageIndex(index);
  };

  const handleImageScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setCurrentImageIndex(Math.round(contentOffsetX / SCREEN_WIDTH));
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {data.images && data.images.length > 0 ? (
          <View className="relative">
            <ScrollView
              ref={imageScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleImageScrollEnd}
              scrollEventThrottle={16}>
              {data.images.map((image, index) => (
                <Image
                  key={image.imageId ?? index}
                  source={{ uri: image.imageUrl }}
                  style={{ width: SCREEN_WIDTH, height: 280 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {data.images.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0">
                <SlideIndicator
                  total={data.images.length}
                  current={currentImageIndex}
                  onPress={handleImageIndicatorPress}
                />
              </View>
            )}
          </View>
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
          <View className="flex-row items-center gap-2">
            <Text className="shrink text-titleSmall">{data.title}</Text>
            {data.isReserved && (
              <Text testID="post-reserved-tag" className="text-xs text-gray-500">
                예약중
              </Text>
            )}
          </View>
          <Text className="text-body3">{data.gwangsan} 광산</Text>
          <Text>{data.content}</Text>

          <TouchableOpacity
            onPress={isMyPost ? onDeletePress : onReportPress}
            disabled={isDeleting}>
            <Text className="mb-24 mt-[25px] text-error-500 underline">
              {isMyPost
                ? isDeleting
                  ? '삭제 처리 중...'
                  : '이 게시글 삭제하기'
                : '이 게시글 신고하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="w-full flex-row justify-center gap-4 bg-white px-6 pb-3 pt-4">
        {review === '1' && !isMyPost ? (
          <Button variant="primary" width="w-full" onPress={onReviewButtonPress}>
            리뷰 작성
          </Button>
        ) : isMyPost ? (
          <Button variant="primary" width="w-[100%]" onPress={onEditPress}>
            수정하기
          </Button>
        ) : (
          <Button variant="primary" width="w-full" onPress={onChatPress} disabled={isChatLoading}>
            {isChatLoading ? '채팅방 생성 중...' : '채팅하러 가기'}
          </Button>
        )}
      </View>
    </View>
  );
};
