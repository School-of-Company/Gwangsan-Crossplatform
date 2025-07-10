import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '~/entity/main/ui/header';
import { Footer } from '~/shared/ui/Footer';
import { Inform, MainSlideViewer } from '~/widget/main';

export default function MainPageView() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      <ScrollView className="flex-1">
        <MainSlideViewer />
        <Inform />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}
