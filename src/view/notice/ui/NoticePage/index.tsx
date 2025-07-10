import { ScrollView } from 'react-native';
import { NoticeItem } from '@/widget/notice';
import { Header } from '@/shared/ui';
import { noticeListMock } from '@/widget/notice/mock/noticeDataMock';
import { SafeAreaView } from 'react-native-safe-area-context';

const NoticePage = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="공지" />
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
    </SafeAreaView>
  );
};

export default NoticePage;
