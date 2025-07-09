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
          <View className="mt-12 flex-row items-center">
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
  );
}

export default memo(SignupForm);
