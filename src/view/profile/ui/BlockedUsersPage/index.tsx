import { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AlertModal, Header } from '~/shared/ui';
import { useBlockUser } from '~/entity/profile/model/useBlockUser';
import { useGetBlockList } from '../../model/useGetBlockList';
import type { BlockedMember } from '../../api/getBlockList';

interface BlockedUserRowProps {
  member: BlockedMember;
}

const BlockedUserRow = ({ member }: BlockedUserRowProps) => {
  const { unblock } = useBlockUser(member.memberId);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const handleUnblockPress = () => {
    setIsAlertVisible(true);
  };

  const handleCloseAlert = () => {
    setIsAlertVisible(false);
  };

  const handleConfirmUnblock = () => {
    setIsAlertVisible(false);
    unblock.mutate();
  };

  return (
    <View className="h-[64px] flex-row items-center justify-between px-6">
      <Text className="flex-1 pr-4 text-lg font-medium text-gray-900" numberOfLines={1}>
        {member.nickname}
      </Text>
      <TouchableOpacity
        onPress={handleUnblockPress}
        disabled={unblock.isPending}
        className={`rounded-lg bg-[#F3F4F5] px-4 py-2 ${unblock.isPending ? 'opacity-50' : ''}`}>
        <Text className="text-sm font-medium text-gray-900">
          {unblock.isPending ? '해제 중...' : '차단 해제'}
        </Text>
      </TouchableOpacity>

      <AlertModal
        isVisible={isAlertVisible}
        message={`${member.nickname}님을 차단 해제하시겠습니까?`}
        confirmText="해제"
        isLoading={unblock.isPending}
        onCancel={handleCloseAlert}
        onConfirm={handleConfirmUnblock}
      />
    </View>
  );
};

export default function BlockedUsersPageView() {
  const { data: blockList, isLoading, isError, error } = useGetBlockList();

  if (isError) {
    Toast.show({
      type: 'error',
      text1: '차단 목록을 불러오는데 실패했습니다.',
      text2: error?.message || '잠시 후 다시 시도해주세요.',
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="차단 목록" showBackButton />
      <FlatList
        data={blockList ?? []}
        keyExtractor={(item) => String(item.memberId)}
        renderItem={({ item }) => <BlockedUserRow member={item} />}
        ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100" />}
        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        ListEmptyComponent={
          !isLoading ? (
            <Text className="pt-20 text-center text-gray-500">차단한 사용자가 없습니다.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
