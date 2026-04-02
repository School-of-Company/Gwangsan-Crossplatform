import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ChatRoomListPage from '@/view/chat/ui/ChatRoomListPage';

export default function Chatting() {
  return (
    <FeatureErrorBoundary>
      <ChatRoomListPage />
    </FeatureErrorBoundary>
  );
}
