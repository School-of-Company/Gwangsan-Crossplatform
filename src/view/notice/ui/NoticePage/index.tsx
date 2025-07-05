import { View, ScrollView } from 'react-native';
import { NoticeItem } from '@/widget/notice';
import { noticeListMock } from '@/widget/notice/mock/noticeDataMock';

const NoticePage = () => {
  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 py-4">
        {noticeListMock.map((notice) => (
          <NoticeItem
            key={notice.id}
            id={notice.id}
            title={notice.title}
            place={notice.place}
            content={notice.content}
            createdAt={notice.createdAt}
            role={notice.role}
            images={notice.images}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default NoticePage;
