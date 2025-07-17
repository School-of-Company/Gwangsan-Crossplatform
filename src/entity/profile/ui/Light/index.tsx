import { clsx } from 'clsx';
import { Text, View } from 'react-native';
import { getLightColor } from '~/shared/lib/handleLightColor';

interface LightProps {
  lightLevel?: number;
}

export default function Light({ lightLevel = 1 }: LightProps) {
  return (
    <View className="px-6 py-10">
      <Text className="mb-6 text-titleSmall">밝기</Text>

      <View className="relative flex h-5 w-full justify-center rounded-xl bg-gray-200">
        <View
          className={clsx('absolute mx-1 h-3 rounded-xl', getLightColor(lightLevel))}
          style={{ width: `${lightLevel}%` }}
        />
      </View>

      <Text className="ml-auto mt-1 text-sub2-300">{Math.ceil(lightLevel / 10)}단계</Text>
    </View>
  );
}
