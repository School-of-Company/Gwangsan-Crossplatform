import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ReportModal } from '~/entity/post/ui';
import { AlertModal, BottomSheetModalWrapper } from '~/shared/ui';
import { useBlockUser } from '~/entity/profile/model/useBlockUser';
import ProfileHeader from '../ProfileHeader';

interface InformationProps {
  name?: string;
  id?: number;
  isMe: boolean;
  isBlocked?: boolean;
}

export default function Information({ name, id, isMe, isBlocked = false }: InformationProps) {
  const R = useRouter();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isReportVisible, setIsReportVisible] = useState(false);
  const [isBlockAlertVisible, setIsBlockAlertVisible] = useState(false);
  const { block, unblock } = useBlockUser(id);

  const handleEditProfile = useCallback(() => {
    R.push(`/profile/${id}/edit`);
  }, [R, id]);

  const handleMenuPress = useCallback(() => {
    setIsMenuVisible(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const handleBlockPress = useCallback(() => {
    setIsMenuVisible(false);
    setIsBlockAlertVisible(true);
  }, []);

  const handleCloseBlockAlert = useCallback(() => {
    setIsBlockAlertVisible(false);
  }, []);

  const handleConfirmBlock = useCallback(() => {
    setIsBlockAlertVisible(false);
    if (isBlocked) {
      unblock.mutate();
    } else {
      block.mutate();
    }
  }, [isBlocked, block, unblock]);

  const handleReportPress = useCallback(() => {
    setIsMenuVisible(false);
    setIsReportVisible(true);
  }, []);

  const handleCloseReport = useCallback(() => {
    setIsReportVisible(false);
  }, []);

  return (
    <>
      <ProfileHeader
        name={name}
        isMe={isMe}
        isMenuDisabled={block.isPending || unblock.isPending}
        onEditProfile={handleEditProfile}
        onMenuPress={handleMenuPress}
      />

      <BottomSheetModalWrapper
        isVisible={isMenuVisible}
        onClose={handleCloseMenu}
        title=""
        hasHeader={false}
        height={230}>
        <View className="gap-8">
          <TouchableOpacity
            onPress={handleBlockPress}
            disabled={block.isPending || unblock.isPending}
            className="items-center py-4">
            <Text className="text-lg">{isBlocked ? '차단 해제하기' : '차단하기'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleReportPress} className="items-center py-4">
            <Text className="text-lg">신고하기</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCloseMenu} className="items-center py-4">
            <Text className="text-lg text-red-500">취소</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModalWrapper>

      <ReportModal memberId={id} isVisible={isReportVisible} onClose={handleCloseReport} />

      <AlertModal
        isVisible={isBlockAlertVisible}
        message={
          isBlocked ? `${name}님의 차단을 해제하시겠습니까?` : `${name}님을 차단하시겠습니까?`
        }
        confirmText={isBlocked ? '해제' : '차단'}
        destructive={!isBlocked}
        isLoading={block.isPending || unblock.isPending}
        onCancel={handleCloseBlockAlert}
        onConfirm={handleConfirmBlock}
      />
    </>
  );
}
