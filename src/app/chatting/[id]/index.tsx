import { FeatureErrorBoundary } from '@/shared/ui/FeatureErrorBoundary';
import { SlideFadeTransition } from '@/shared/ui/SlideFadeTransition';
import ChatRoomPage from '@/view/chat/ui/ChatRoomPage';

export default function Chatting() {
  return (
    <FeatureErrorBoundary featureName="ChatRoom">
      <SlideFadeTransition direction="right">
        <ChatRoomPage />
      </SlideFadeTransition>
    </FeatureErrorBoundary>
  );
}
