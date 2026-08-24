import { ScrollView, View, RefreshControl } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gwangsan, Information, Light } from '~/entity/profile/ui';
import { Introduce, ProfileMenu } from '~/widget/profile/ui';
import Toast from 'react-native-toast-message';
import { useGetProfile } from '../../model/useGetProfile';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '~/shared/ui';
import { useGetMyProfile } from '../../model/useGetMyProfile';
import { useGetBlockList } from '../../model/useGetBlockList';

export default function ProfilePageView() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: profileData,
    error: profileError,
    isError: profileIsError,
    refetch: refetchProfile,
  } = useGetProfile(id);

  const isMe = !Boolean(id);

  const { data: myProfileData, refetch: refetchMyProfile } = useGetMyProfile(isMe);

  const { data: blockList } = useGetBlockList();
  const targetMemberId = profileData?.memberId;
  const isBlocked = !!blockList?.some((b) => b.memberId === targetMemberId);

  const activeMemberId = isMe ? myProfileData?.memberId : profileData?.memberId;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await (isMe ? refetchMyProfile() : refetchProfile());
    } finally {
      setRefreshing(false);
    }
  };

  if (profileIsError) {
    Toast.show({
      type: 'error',
      text1: '프로필을 불러오는데 실패했습니다.',
      text2: profileError.message || '잠시 후 다시 시도해주세요.',
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="프로필" showBackButton={!isMe} />
      <Information
        isMe={isMe}
        id={isMe ? myProfileData?.memberId : profileData?.memberId}
        name={isMe ? myProfileData?.nickname : profileData?.nickname}
        isBlocked={isBlocked}
      />
      <ScrollView
        className="flex-0.8 flex gap-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="bg-white pb-14">
          <Introduce
            introduce={isMe ? myProfileData?.description : profileData?.description}
            specialty={isMe ? myProfileData?.specialties : profileData?.specialties}
          />
          <Light lightLevel={isMe ? myProfileData?.light : profileData?.light} />
          {isMe && <Gwangsan gwangsan={myProfileData?.gwangsan} />}
        </View>
        <ProfileMenu
          isMe={isMe}
          memberId={activeMemberId}
          name={isMe ? myProfileData?.nickname : profileData?.nickname}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
