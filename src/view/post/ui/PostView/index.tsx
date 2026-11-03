import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Header, PillTabs } from '~/shared/ui';
import { handleCategory, Category } from '~/entity/post';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModeType } from '~/shared/types/mode';
import { ProductType } from '~/shared/types/type';
import { PostList } from '~/widget/post';

export default function PostView() {
  const { type, mode } = useLocalSearchParams<{ type: ProductType; mode?: ModeType }>();

  const getInitialCategory = (): Category => {
    if (mode) {
      if (type === 'OBJECT') {
        return mode === 'GIVER' ? '팔아요' : '필요해요';
      } else {
        return mode === 'GIVER' ? '할 수 있어요' : '해주세요';
      }
    }
    return type === 'OBJECT' ? '팔아요' : '할 수 있어요';
  };

  const [category, setCategory] = useState<Category>(getInitialCategory());
  // 같은 화면이 다른 type·mode로 다시 열리면(딥링크 등) 이전 탭 값이 남지 않도록 맞춘다
  const paramsKey = `${type}:${mode ?? ''}`;
  const [lastParamsKey, setLastParamsKey] = useState(paramsKey);
  if (lastParamsKey !== paramsKey) {
    setLastParamsKey(paramsKey);
    setCategory(getInitialCategory());
  }

  const categories = handleCategory(type as ProductType) ?? [];
  const tabs = categories.map((v) => ({ value: v as Category, label: v }));
  const activeCategory = categories.includes(category) ? category : (categories[0] as Category);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header headerTitle={type === 'SERVICE' ? '서비스' : '물건'} />
      <PillTabs
        tabs={tabs}
        value={activeCategory}
        onChange={setCategory}
        containerClassName="mx-6 mb-6 mt-5"
        testIDPrefix="post-category-tab"
      />
      <PostList type={type} category={activeCategory} />
    </SafeAreaView>
  );
}
