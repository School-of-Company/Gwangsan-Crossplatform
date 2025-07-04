import { Text, TouchableOpacity, View } from 'react-native';

const Button = ['내 글', '거래내역', '내가 작성한 후기'];

export default function Active() {
  return (
    <View className="mt-3 bg-white px-6 pb-14 pt-8">
      <Text className="text-titleSmall">내 활동</Text>
      <View className="mt-6 flex flex-row justify-between">
        {Button.map((v) => {
          return (
            <TouchableOpacity className="rounded-md border border-main-500 px-6 py-3" key={v}>
              <Text className="text-main-500">{v}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
