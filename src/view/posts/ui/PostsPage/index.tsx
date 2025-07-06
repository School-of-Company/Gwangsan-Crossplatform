import { useState } from 'react';
import { Text, View } from 'react-native';
import { Dropdown } from '~/shared/ui';

export default function PostPageView() {
  const [firstValue, setFirstValue] = useState<'물건' | '서비스' | null>(null);
  return (
    <View className="pb-16">
      <Text className="text-titleSmall">카테고리 선택 후 거래내역 확인</Text>
      <View className="mt-4 flex-row items-center justify-between gap-2 px-6">
        <Dropdown items={['물건', '서비스']} placeholder="선택" width="w-[45%]" />
        <Dropdown
          items={firstValue === '서비스' ? ['할수있어요', '해주세요'] : ['팔아요', '필요해요']}
          placeholder="선택"
          width="w-[45%]"
        />
      </View>
    </View>
  );
}
