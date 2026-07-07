import { useState } from 'react';
import { Footer } from '~/shared/ui/Footer';
import { WriteEntryModal } from '../WriteEntryModal';

export function AppFooter() {
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);

  return (
    <>
      <Footer onWritePress={() => setIsWriteModalVisible(true)} />
      <WriteEntryModal
        isVisible={isWriteModalVisible}
        onClose={() => setIsWriteModalVisible(false)}
      />
    </>
  );
}
