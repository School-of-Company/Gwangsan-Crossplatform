import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { Button } from '@/shared/ui/Button';
import { ReactNode, memo } from 'react';
import { useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import BackArrow from '@/shared/assets/svg/BackArrow';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface SignupFormProps {
  title: string;
  description: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextButtonText?: string;
  isNextDisabled?: boolean;
}

function SignupForm({
  title,
  description,
  children,
  onBack,
  onNext,
  nextButtonText = '다음',
  isNextDisabled = false,
}: SignupFormProps) {
  const { prevStep } = useSignupStepNavigation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-8 px-6">
          <View className="flex-row items-center pt-4">
            <TouchableOpacity className="flex-row items-center" onPress={onBack || prevStep}>
              <BackArrow />
              <Text className="ml-2 text-gray-500">뒤로</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text className="text-3xl font-bold">{title}</Text>
            <Text className="mt-4 text-lg text-gray-700">{description}</Text>
          </View>

          <View className="mt-8">{children}</View>
        </View>
      </ScrollView>

      <KeyboardStickyView offset={{ opened: insets.bottom }}>
        <View className="bg-white px-5 pb-3 pt-5">
          <Button onPress={onNext} disabled={isNextDisabled}>
            {nextButtonText}
          </Button>
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}

export default memo(SignupForm);
