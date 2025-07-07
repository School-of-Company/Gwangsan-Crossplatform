import { useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { Header } from '~/shared/ui';

export default function TransactionPageView() {
  const [category, setCategory] = useState<'할 수 있어요' | '해주세요'>('할 수 있어요');
  return (
    <SafeAreaView className="android:pt-10 h-full bg-white">
      <Header headerTitle="서비스" />
      <View className="bg mx-6 mb-6 mt-5 h-[45px] flex-row items-center rounded-[30px] bg-sub2-300 px-2">
        <Text className="rounded-[32px] bg-white px-[60px] py-[6px]">해주세요</Text>
        <Text className="rounded-[32px] px-[60px] py-[6px]">할 수 있어요</Text>
      </View>
    </SafeAreaView>
  );
}
