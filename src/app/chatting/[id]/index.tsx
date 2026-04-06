import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import ChatRoomPage from '@/view/chat/ui/ChatRoomPage';

export default function Chatting() {
  return (
    <FeatureErrorBoundary>
      <ChatRoomPage />
    </FeatureErrorBoundary>
  );
}
