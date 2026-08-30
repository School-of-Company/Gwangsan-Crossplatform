import React, { useCallback, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomSheetModalWrapper } from '~/shared/ui';
import { ReportModal } from '~/entity/post/ui';
import { useBlockUser } from '~/entity/profile/model/useBlockUser';

interface ChatRoomHeaderProps {
  readonly otherUserNickname: string;
  readonly otherUserId?: number;
  readonly lastMessageDate: string;
  readonly onProfilePress: () => void;
}

export const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  otherUserNickname,
  otherUserId,
  lastMessageDate,
  onProfilePress,
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isReportVisible, setIsReportVisible] = useState(false);
  const { block } = useBlockUser(otherUserId);

  const handleMenuPress = useCallback(() => {
    setIsMenuVisible(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const handleBlockPress = useCallback(() => {
    setIsMenuVisible(false);
    Alert.alert('사용자 차단', `${otherUserNickname}님을 차단하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '차단', style: 'destructive', onPress: () => block.mutate() },
    ]);
  }, [otherUserNickname, block]);

  const handleReportPress = useCallback(() => {
    setIsMenuVisible(false);
    setIsReportVisible(true);
  }, []);

  const handleCloseReport = useCallback(() => {
    setIsReportVisible(false);
  }, []);

  return (
    <View className="bg-white">
      <View className="flex-row items-center justify-between px-4 py-8">
        <View className="w-8" />
        <View className="items-center">
          <TouchableOpacity onPress={onProfilePress} disabled={!otherUserId}>
            <Text className="mb-2 text-xl font-bold text-gray-900">{otherUserNickname}</Text>
          </TouchableOpacity>
          <Text className="text-sm text-gray-500">{lastMessageDate}</Text>
        </View>
        <TouchableOpacity
          testID="ChatRoomHeader-menu-button"
          onPress={handleMenuPress}
          disabled={!otherUserId || block.isPending}
          className="w-8 items-end">
          <MaterialIcons name="more-vert" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <BottomSheetModalWrapper
        isVisible={isMenuVisible}
        onClose={handleCloseMenu}
        title=""
        hasHeader={false}
        height={230}>
        <View className="gap-8">
          <TouchableOpacity
            testID="ChatRoomHeader-block-button"
            onPress={handleBlockPress}
            disabled={block.isPending}
            className="items-center py-4">
            <Text className="text-lg">차단하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="ChatRoomHeader-report-button"
            onPress={handleReportPress}
            className="items-center py-4">
            <Text className="text-lg">신고하기</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCloseMenu} className="items-center py-4">
            <Text className="text-lg text-red-500">취소</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModalWrapper>

      <ReportModal memberId={otherUserId} isVisible={isReportVisible} onClose={handleCloseReport} />
    </View>
  );
};
