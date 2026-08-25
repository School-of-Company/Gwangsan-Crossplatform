import { useState } from 'react';
import { Text, View } from 'react-native';
import { PostType } from '~/shared/types/postType';
import { MODE, ModeType } from '~/shared/types/mode';
import Post from '~/shared/ui/Post';
import { PillTabs } from '~/shared/ui';

interface CompletedTradesProps {
  posts?: PostType[];
  isMe: boolean;
  name?: string;
  showTitle?: boolean;
}

const TRADE_HISTORY_TABS = [
  { value: MODE.RECEIVER, label: '구매 내역' },
  { value: MODE.GIVER, label: '판매 내역' },
];

const getEmptyMessage = (mode: ModeType) =>
  mode === MODE.RECEIVER ? '구매한 품목이 없습니다.' : '판매한 품목이 없습니다.';

export default function CompletedTrades({
  posts = [],
  isMe,
  name,
  showTitle = true,
}: CompletedTradesProps) {
  const [activeTab, setActiveTab] = useState<ModeType>(MODE.RECEIVER);
  const completedPosts = posts.filter((post) => post.isCompleted && post.mode === activeTab);

  return (
    <View className="mt-3 flex gap-6 bg-white pb-9 pt-10">
      {showTitle && (
        <Text className="px-6 text-titleSmall">
          {isMe ? '거래 완료 품목' : `${name ?? ''}님의 거래 완료 품목`}
        </Text>
      )}
      <PillTabs
        tabs={TRADE_HISTORY_TABS}
        value={activeTab}
        onChange={setActiveTab}
        containerClassName="mx-6 mb-3"
        testIDPrefix="trade-history-tab"
      />
      {completedPosts.length > 0 ? (
        <View className="gap-6">
          {completedPosts.map((post) => (
            <Post {...post} key={post.id} />
          ))}
        </View>
      ) : (
        <Text className="px-6 text-center text-gray-500">{getEmptyMessage(activeTab)}</Text>
      )}
    </View>
  );
}
