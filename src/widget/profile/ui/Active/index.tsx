import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

interface ActiveProps {
  isMe: boolean;
  id: string;
}
export default function Active({ isMe, id }: ActiveProps) {
  const router = useRouter();
  return (
    <View className="mt-3 bg-white px-6 pb-14 pt-8">
      <Text className="text-titleSmall">내 활동</Text>
      <View className="mt-6 flex flex-row items-center justify-center gap-3">
        <TouchableOpacity
          className={`items-center rounded-md border border-main-500 px-6 py-3 text-center ${isMe ? 'w-1/2' : 'w-full'}`}
          onPress={() => router.push(`/reviews/${id}?active=receive`)}>
          <Text className="text-main-500">내가 받은 후기</Text>
        </TouchableOpacity>
        {isMe && (
          <TouchableOpacity
            className="w-1/2 items-center rounded-md border border-main-500 px-6 py-3 text-center"
            onPress={() => router.push('/reviews?active=toss')}>
            <Text className="text-main-500">내가 작성한 후기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
