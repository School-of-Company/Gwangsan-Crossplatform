import { View } from 'react-native';
import { AuthButtonContainer } from '~/entity/onboarding';
import { OnboardingSlideViewer } from '~/widget/onboarding';
import { SafeAreaView } from 'react-native-safe-area-context';

const OnboardingPage = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View className="flex-7">
          <OnboardingSlideViewer />
        </View>
        <View className="flex-1" />
        <View className="flex-2">
          <AuthButtonContainer />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingPage;
