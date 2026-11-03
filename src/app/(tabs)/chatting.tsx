import { FeatureErrorBoundary } from '~/shared/ui/FeatureErrorBoundary';
import { ChatRoomListPage } from '~/view/chat';

export default function Chatting() {
  return (
    <FeatureErrorBoundary featureName="ChatRoomList">
      <ChatRoomListPage />
    </FeatureErrorBoundary>
  );
}
