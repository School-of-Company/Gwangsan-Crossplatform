import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

const buttonList = [
  { id: 'receive', label: '내가 받은 후기' },
  { id: 'toss', label: '내가 작성한 후기' },
];

export default function Active() {
  const router = useRouter();

  return (
    <View className="mt-3 bg-white px-6 pb-14 pt-8">
      <Text className="text-titleSmall">내 활동</Text>
      <View className="mt-6 flex flex-row justify-between">
        {buttonList.map((button) => {
          return (
            <TouchableOpacity
              className="rounded-md border border-main-500 px-6 py-3"
              key={button.id}
              onPress={() => router.push(`/posts?active=${button.id}`)}>
              <Text className="text-main-500">{button.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
