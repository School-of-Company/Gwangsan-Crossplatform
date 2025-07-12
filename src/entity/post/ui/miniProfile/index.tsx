import { Image, Text, View } from 'react-native';
import { getLightColor } from '~/shared/lib/handleLightColor';

interface MiniProfileProps {
  nickname: string;
  placeName: string;
  light: number;
}

export default function MiniProfile({ nickname, placeName, light }: MiniProfileProps) {
  const lightText = `${light}단계`;
  const lightColor = `text-${getLightColor(light)}`;

  return (
    <View className=" flex-row items-center justify-between border-b border-b-gray-100 px-6 py-3">
      <View className="flex-row gap-3">
        <Image
          className="h-[50px] w-[50px]"
          source={require('~/shared/assets/png/defaultProfile.png')}
        />
        <View className="gap-[5px]">
          <Text className="text-body3">{nickname}</Text>
          <Text>{placeName}</Text>
        </View>
      </View>
      <Text className={`text-body1 ${lightColor}`}>{lightText}</Text>
    </View>
  );
}
