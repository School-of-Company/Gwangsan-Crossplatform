import { useState } from 'react';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Footer } from '~/shared/ui/Footer';
import { WriteEntryModal } from '../WriteEntryModal';

export function AppFooter(props: BottomTabBarProps) {
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);

  return (
    <>
      <Footer {...props} onWritePress={() => setIsWriteModalVisible(true)} />
      <WriteEntryModal
        isVisible={isWriteModalVisible}
        onClose={() => setIsWriteModalVisible(false)}
      />
    </>
  );
}
