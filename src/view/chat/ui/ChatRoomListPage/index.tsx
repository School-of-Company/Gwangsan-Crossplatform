import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/shared/ui/Header';
import { ChatRoomList } from '@/widget/chat';
import { AppFooter } from '@/widget/write/ui/AppFooter';

export default function ChatRoomListPage() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="채팅" />
      <ChatRoomList />
      <AppFooter />
    </SafeAreaView>
  );
}
