import { Image, Text, TouchableOpacity, View } from 'react-native';
import { getLightColor } from '~/shared/lib/handleLightColor';
import { ReviewPostType } from '~/view/reviews/model/reviewPostType';
import { clsx } from 'clsx';
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
  return (
    <TouchableOpacity
      onPress={handleClick}
      className="flex flex-row gap-9 border-b border-b-gray-200 px-6 py-3">
      {images.length > 0 ? (
        images.map((image, index) => (
          <Image key={index} source={{ uri: image.imageUrl }} className="size-24 rounded-lg" />
        ))
      ) : (
        <Image className="size-[100px]" source={require('~/shared/assets/png/gwangsanLogo.png')} />
      )}
      <View className="gap-[10px] px-6 py-[10px]">
        <View className="relative flex h-4 w-[120px] justify-center rounded-xl bg-gray-200">
          <View
            style={{ width: `${review.light}%` }}
            className={clsx('absolute mx-1 h-2 rounded-xl', getLightColor(review.light))}
          />
        </View>
        <Text className="mb-1 max-w-[200px] flex-wrap text-label text-[#555555]">
          {review.content}
        </Text>
        {mode === 'receive' ? (
          <Text className="text-label">작성자 {review.reviewerName}</Text>
        ) : (
          <Text className="text-label text-gray-400">내가 작성한 후기</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
