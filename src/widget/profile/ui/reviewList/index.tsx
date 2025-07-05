import { Text, View } from 'react-native';
import ReviewPost from '~/entity/profile/ui/ReviewPost';

export default function ReviewList() {
  return (
    <View className="mt-3 flex gap-6 bg-white px-6 pb-9 pt-10">
      <Text className=" text-titleSmall">내 후기</Text>
      <ReviewPost />
      <ReviewPost />
    </View>
  );
}
