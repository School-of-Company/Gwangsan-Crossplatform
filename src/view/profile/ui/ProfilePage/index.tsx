import { ScrollView, View, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gwangsan,
  Information,
  Light,
  useGetProfile,
  useGetMyProfile,
  useGetBlockList,
} from '~/entity/profile';
import { Introduce, ProfileMenu } from '~/widget/profile';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '~/shared/ui';
import { ErrorFallback } from '~/shared/ui/ErrorFallback';
import { usePullToRefresh } from '~/shared/model/usePullToRefresh';
import { useErrorToastOnTransition } from '~/shared/model/useErrorToastOnTransition';

export default function ProfilePageView() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: profileData,
    error: profileError,
    isError: profileIsError,
    isLoading: profileIsLoading,
    refetch: refetchProfile,
  } = useGetProfile(id);

  const isMe = !Boolean(id);

  const {
    data: myProfileData,
    error: myProfileError,
    isError: myProfileIsError,
    isLoading: myProfileIsLoading,
    refetch: refetchMyProfile,
  } = useGetMyProfile(isMe);

  // 지금 화면에 보여주는 프로필(내 프로필 또는 상대 프로필)의 조회 상태
  const activeProfile = isMe ? myProfileData : profileData;
  const activeError = isMe ? myProfileError : profileError;
  const activeIsError = isMe ? myProfileIsError : profileIsError;
  const activeIsLoading = isMe ? myProfileIsLoading : profileIsLoading;
  const refetchActiveProfile = isMe ? refetchMyProfile : refetchProfile;

  const { data: blockList } = useGetBlockList();
  const targetMemberId = profileData?.memberId;
  const isBlocked = !!blockList?.some((b) => b.memberId === targetMemberId);

  const activeMemberId = isMe ? myProfileData?.memberId : profileData?.memberId;

  const { refreshing, onRefresh } = usePullToRefresh(refetchActiveProfile);

  useErrorToastOnTransition(
    activeIsError,
    '프로필을 불러오는데 실패했습니다.',
    activeError?.message
  );

  // 조회가 늦어지거나 실패했을 때 값이 모두 비어 있는 빈 레이아웃(회색 화면)이 남지 않도록,
  // 받아둔 프로필이 없으면 로딩 표시나 다시 시도 화면을 보여준다
  if (!activeProfile && (activeIsLoading || activeIsError)) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <Header headerTitle="프로필" showBackButton={!isMe} />
        {activeIsError ? (
          <ErrorFallback onRetry={() => refetchActiveProfile()} />
        ) : (
          <View testID="profile-loading" className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#8FC31D" />
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header headerTitle="프로필" showBackButton={!isMe} />
      <ScrollView
        testID="profile-scroll"
        className="flex-0.8 flex gap-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Information
          isMe={isMe}
          id={isMe ? myProfileData?.memberId : profileData?.memberId}
          name={isMe ? myProfileData?.nickname : profileData?.nickname}
          isBlocked={isBlocked}
        />
        <View className="bg-background pb-14">
          <Introduce
            introduce={isMe ? myProfileData?.description : profileData?.description}
            specialty={isMe ? myProfileData?.specialties : profileData?.specialties}
          />
          <Light lightLevel={isMe ? myProfileData?.light : profileData?.light} />
          {isMe && <Gwangsan gwangsan={myProfileData?.gwangsan} />}
        </View>
        <ProfileMenu isMe={isMe} memberId={activeMemberId} />
      </ScrollView>
    </SafeAreaView>
  );
}
