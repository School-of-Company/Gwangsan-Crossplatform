import { View, ScrollView } from 'react-native';
import Header from '~/entity/main/ui/header';
import { Footer } from '~/shared/ui/Footer';
import { Inform, MainSlideViewer } from '~/widget/main';

export default function MainPageView() {
  return (
    <View className="flex h-full bg-white">
      <Header />
      <ScrollView className="flex-1">
        <MainSlideViewer />
        <Inform />
      </ScrollView>
      <Footer />
    </View>
  );
}
