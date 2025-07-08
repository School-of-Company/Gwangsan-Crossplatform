import { Image, SafeAreaView, ScrollView, Text, View } from 'react-native';
import MiniProfile from '~/entity/post/ui/miniProfile';
import { Button, Header } from '~/shared/ui';

export default function PostPageView() {
  return (
    <SafeAreaView className="h-full bg-white">
      <Header headerTitle="해주세요" />
      <ScrollView>
        <Image source={require('~/shared/assets/png/logo.png')} className="h-[280px] w-full" />
        <MiniProfile />
        <View className="gap-6 p-6">
          <Text className="text-titleSmall">집 청소좀 해주세요</Text>
          <Text className="text-body3">5000 광산</Text>
          <Text>
            (지역명) 집 청소 도와주실 분 찾습니다. 바닥, 화장실 위주로 부탁드리며, 청소 도구는
            준비되어 있습니다. (희망 날짜)에 가능하신 분 연락 주세요! 급여는 (금액)입니다.
          </Text>
          <Text className="mb-24 mt-[25px] text-error-500 underline">이 게시글 신고하기</Text>
          <View className="w-full flex-row justify-center gap-4">
            <Button variant="secondary" width="w-1/2">
              채팅하기
            </Button>
            <Button variant="primary" width="w-1/2">
              거래완료
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
