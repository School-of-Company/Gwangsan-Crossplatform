import { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '~/entity/main/ui/header';
import { GwangsanBanner, Inform, MainSlideViewer } from '~/widget/main';
import { useGetMyInformation } from '../../../../entity/main/model/useGetMyInformation';
import Toast from 'react-native-toast-message';

export default function MainPageView() {
  const { data, isError, error } = useGetMyInformation();

  useEffect(() => {
    if (isError)
      Toast.show({
        type: 'error',
        text1: '정보 조회 실패',
        text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
  }, [isError, error]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header />
      <ScrollView className="flex-1">
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
