import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Button } from '@/shared/ui/Button';
import { ReactNode, memo } from 'react';
import { useStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import BackArrow from '@/shared/assets/svg/BackArrow';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { prevStep } = useStepNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-8 px-6">
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

            <View className="mt-8 flex-1">{children}</View>

            <View className="mb-8 mt-auto">
              <Button onPress={onNext} disabled={isNextDisabled}>
                {nextButtonText}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default memo(SignupForm);
