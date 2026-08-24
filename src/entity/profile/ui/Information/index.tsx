import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { ReportModal } from '~/entity/post/ui';
import { BottomSheetModalWrapper } from '~/shared/ui';
import { useBlockUser } from '~/view/profile/model/useBlockUser';
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
    if (isBlocked) {
      Alert.alert('차단 해제', `${name}님의 차단을 해제하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        { text: '해제', onPress: () => unblock.mutate() },
      ]);
    } else {
      Alert.alert('사용자 차단', `${name}님을 차단하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        { text: '차단', style: 'destructive', onPress: () => block.mutate() },
      ]);
    }
  }, [isBlocked, name, block, unblock]);

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
    </>
  );
}
