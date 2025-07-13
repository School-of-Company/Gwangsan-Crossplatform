import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '~/entity/main/ui/header';
import { Footer } from '~/shared/ui/Footer';
import { Inform, MainSlideViewer } from '~/widget/main';
import { useGetMyInformation } from '../../model/useGetMyInformation';
import Toast from 'react-native-toast-message';

export default function MainPageView() {
  const { data, isError, error } = useGetMyInformation();
  if (isError)
    Toast.show({
      type: 'error',
      text1: '정보 조회 실패',
      text2: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    });
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      <ScrollView className="flex-1">
        <MainSlideViewer />
        <Inform dong={data?.dongName} place={data?.placeName} />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}
