import { Image, Text, View } from 'react-native';
import { getLightColor } from '~/shared/lib/handleLightColor';
import { ReviewPostType } from '~/view/reviews/model/reviewPostType';
import { clsx } from 'clsx';

interface ReviewPostProps {
  review: ReviewPostType;
}

export default function ReviewPost({ review }: ReviewPostProps) {
  return (
    <View className="flex flex-row gap-9 border-b border-b-gray-200 px-6 py-3">
      {review.images &&
        review.images.map((image, index) => (
          <Image key={index} source={{ uri: image.imageUrl }} className="size-24 rounded-lg" />
        ))}
      <View>
        <View className="relative flex h-5 w-full justify-center rounded-xl bg-gray-200">
          <View
            className={clsx(
              `absolute mx-1 h-3 rounded-xl width-${String(review.light)}`,
              getLightColor(review.light)
            )}
          />
        </View>
        <Text className="mb-1 max-w-[200px] flex-wrap text-label text-[#555555]">
          {review.content}
        </Text>
        <Text className="text-label">{review.reviewerName}</Text>
      </View>
    </View>
  );
}
