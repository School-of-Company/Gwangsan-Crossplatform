import { Text, View } from 'react-native';

interface LightProps {
  lightLevel?: number;
}

// 서버는 밝기(0~100)를 게시글 작성자 정보 등에서 Math.max(1, light / 10)(정수 나눗셈)으로 단계로 바꿔 내려준다.
// 같은 회원이 화면마다 다른 단계로 보이지 않도록 같은 계산을 쓴다.
const toLightStep = (lightLevel: number) => Math.max(1, Math.floor(lightLevel / 10));

export default function Light({ lightLevel = 1 }: LightProps) {
  return (
    <View className="px-6 py-10">
      <Text className="mb-6 text-titleSmall text-foreground">밝기</Text>

      <View className="relative flex h-5 w-full justify-center rounded-xl bg-gray-200">
        <View className="absolute left-1 right-1 h-3 overflow-hidden rounded-xl">
          <View
            testID="light-fill"
            className="h-full rounded-xl bg-main-500"
            style={{ width: `${Math.min(Math.max(lightLevel, 0), 100)}%` }}
          />
        </View>
      </View>

      <Text className="ml-auto text-foreground">{toLightStep(lightLevel)}단계</Text>
    </View>
  );
}
