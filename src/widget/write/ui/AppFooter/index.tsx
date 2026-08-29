import { useState } from 'react';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Footer } from '~/shared/ui/Footer';
import { useChatRooms } from '~/entity/chat';
import { WriteEntryModal } from '../WriteEntryModal';

export function AppFooter(props: BottomTabBarProps) {
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const { totalUnreadCount } = useChatRooms();

  return (
    <>
      <Footer
        {...props}
        totalUnreadCount={totalUnreadCount}
        onWritePress={() => setIsWriteModalVisible(true)}
      />
      <WriteEntryModal
        isVisible={isWriteModalVisible}
        onClose={() => setIsWriteModalVisible(false)}
      />
    </>
  );
}
