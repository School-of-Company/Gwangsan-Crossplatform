import { useState } from 'react';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Footer } from '~/shared/ui/Footer';
import { useChatRooms } from '~/entity/chat';
import { WriteEntryModal } from '../WriteEntryModal';

export function AppFooter(props: BottomTabBarProps) {
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  // 탭바는 화면별 에러 바운더리 밖에서 렌더링된다. 안 읽은 수 조회가 실패했다고 앱 전체를 에러
  // 화면으로 바꾸지 않고, 뱃지만 표시하지 않는다(#740)
  const { totalUnreadCount } = useChatRooms({ throwOnError: false });

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
