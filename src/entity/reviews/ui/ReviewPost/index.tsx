import { Image, Text, TouchableOpacity, View } from 'react-native';
import { LightBar } from '~/shared/ui';
import { ReviewPostType } from '~/view/reviews/model/reviewPostType';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

interface ReviewPostProps {
  review: ReviewPostType;
  mode?: 'toss' | 'receive';
}

export default function ReviewPost({ review, mode = 'receive' }: ReviewPostProps) {
  const R = useRouter();
  const handleClick = useCallback(() => {
    R.push('/cancelTrade/' + review.reviewId);
  }, [R, review]);
  const images = review.imageUrls ?? review.images ?? [];
  // 썸네일을 개수만큼 가로로 늘어놓으면 형제인 본문 영역(flex-1)이 밀려 사라지므로
  // 대표 이미지 한 장만 고정 크기로 보여주고 나머지는 +N 배지로 알린다.
  const thumbnail = images[0];
  const hiddenImageCount = Math.max(images.length - 1, 0);

  return (
    <View className="overflow-hidden rounded-2xl bg-gray-50">
      <TouchableOpacity
        onPress={handleClick}
        activeOpacity={0.7}
        className="flex-row items-center gap-4 px-5 py-5">
        {thumbnail ? (
          <View className="relative">
            <Image
              source={{ uri: thumbnail.imageUrl }}
              style={{ width: 80, height: 80, borderRadius: 12 }}
            />
            {hiddenImageCount > 0 && (
              <View
                testID="review-post-hidden-image-count"
                className="absolute bottom-1 right-1 rounded-full bg-black/60 px-2 py-0.5">
                <Text className="text-caption text-white">+{hiddenImageCount}</Text>
              </View>
            )}
          </View>
        ) : (
          <Image
            source={require('~/shared/assets/png/gwangsanLogo.png')}
            style={{ width: 80, height: 80, borderRadius: 12 }}
          />
        )}
        <View className="flex-1 gap-1">
          <LightBar value={review.light} />
          <Text className="text-sm text-gray-700" numberOfLines={2}>
            {review.content}
          </Text>
          {mode === 'receive' ? (
            <Text className="text-sm text-gray-500">작성자 {review.reviewerName}</Text>
          ) : (
            <Text className="text-sm text-gray-500">
              {review.targetName ? `받은 사람 ${review.targetName}` : '내가 작성한 후기'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
