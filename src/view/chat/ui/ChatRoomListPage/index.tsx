import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/shared/ui/Header';
import { Footer } from '@/shared/ui/Footer';
import { ChatRoomList } from '@/widget/chat';

export default function ChatRoomListPage() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="채팅" />
      <ChatRoomList />
      <Footer />
    </SafeAreaView>
  );
}
