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
  const additionalImagesCount = images.length - 1;
  return (
    <View className="overflow-hidden rounded-2xl bg-gray-50">
      <TouchableOpacity
        onPress={handleClick}
        activeOpacity={0.7}
        className="flex-row items-center gap-4 px-5 py-5">
        <View className="relative">
          <Image
            source={
              images[0]
                ? { uri: images[0].imageUrl }
                : require('~/shared/assets/png/gwangsanLogo.png')
            }
            style={{ width: 80, height: 80, borderRadius: 12 }}
          />
          {additionalImagesCount > 0 && (
            <View className="absolute bottom-1 right-1 rounded-md bg-black/50 px-2 py-1">
              <Text className="text-xs text-white">+{additionalImagesCount}</Text>
            </View>
          )}
        </View>
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
