import { useEffect } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '~/entity/main';
import { GwangsanBanner, Inform, MainSlideViewer } from '~/widget/main';
import { useGetMyInformation } from '~/entity/profile';
import Toast from 'react-native-toast-message';
import { usePullToRefresh } from '~/shared/model/usePullToRefresh';

export default function MainPageView() {
  const { data, isError, refetch } = useGetMyInformation();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  // 서버 메시지 원문은 사용자에게 의미가 없으므로 고정 문구만 보여준다
  useEffect(() => {
    if (isError)
      Toast.show({
        type: 'error',
        text1: '정보 조회 실패',
        text2: '잠시 후 다시 시도해 주세요.',
      });
  }, [isError]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header />
      <ScrollView
        testID="main-scroll"
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <MainSlideViewer />
        <GwangsanBanner gwangsan={data?.gwangsan} />
        <Inform
          head={data?.headName ?? '본점'}
          dong={data?.dongName ?? '동'}
          place={data?.placeName ?? '지점'}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
