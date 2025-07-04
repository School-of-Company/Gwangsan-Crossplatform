import { View } from 'react-native';
import Header from '~/entity/main/ui/header';
import { Footer } from '~/shared/ui/Footer';
import { Inform, MainSlideViewer } from '~/widget/main';

export default function MainPageView() {
  return (
    <View className="flex h-full bg-white">
      <Header />
      <MainSlideViewer />
      <Inform />
      <Footer />
    </View>
  );
}
