import { Text, View } from 'react-native';

interface IntroduceProps {
  specialty?: string[];
  introduce?: string;
}

export default function Introduce({ specialty, introduce }: IntroduceProps) {
  return (
    <View className="px-6">
      <Text className="mb-6 text-titleSmall">소개</Text>
      <View className="mb-3 flex-row gap-3">
        {specialty &&
          specialty.length > 0 &&
          specialty.map((v, i) => {
            return (
              <Text
                className="rounded-[30px] border border-gray-300 px-3 py-2 text-label text-gray-700"
                key={i}>
                {v}
              </Text>
            );
          })}
      </View>
      <Text className="text-body4 text-gray-800">{introduce}</Text>
    </View>
  );
}
