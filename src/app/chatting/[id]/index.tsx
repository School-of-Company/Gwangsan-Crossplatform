import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { ChatRoomPage } from '~/view/chat';

export default function Chatting() {
  return (
    <FeatureErrorBoundary featureName="ChatRoom">
      <ChatRoomPage />
    </FeatureErrorBoundary>
  );
}
