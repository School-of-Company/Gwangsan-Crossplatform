import React from 'react';
import { Image, ScrollView, Text, View, TouchableOpacity, RefreshControl } from 'react-native';
import MiniProfile from '~/entity/post/ui/miniProfile';
import { Button } from '~/shared/ui';
import type { PostDetailResponse } from '~/entity/post/api/getItem';

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
  computedValues,
  onDeletePress,
  onReportPress,
  onEditPress,
  onChatPress,
  onTradeRequest,
  onReviewButtonPress,
  onRefresh,
}) => {
  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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

        <View className="w-full flex-row justify-center gap-4">
          {review === '1' ? (
            <Button variant="primary" width="w-full" onPress={onReviewButtonPress}>
              리뷰 작성
            </Button>
          ) : (
            <>
              {isMyPost ? (
                <Button variant="secondary" width="w-1/2" onPress={onEditPress}>
                  수정하기
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  width="w-1/2"
                  onPress={onChatPress}
                  disabled={isChatLoading}>
                  {isChatLoading ? '채팅방 생성 중...' : '채팅하기'}
                </Button>
              )}
              {isMyPost ? (
                <Button variant="primary" width="w-1/2" onPress={onEditPress}>
                  수정하기
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  width="w-1/2" 
                  onPress={onTradeRequest}
                  disabled={computedValues.isTradeButtonDisabled}>
                  {computedValues.tradeButtonText}
                </Button>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
