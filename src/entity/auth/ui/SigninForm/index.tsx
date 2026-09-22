import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { Button } from '@/shared/ui/Button';
import { ReactNode, memo } from 'react';
import { router } from 'expo-router';
import BackArrow from '@/shared/assets/svg/BackArrow';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface SigninFormProps {
  title: string;
  description: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextButtonText?: string;
  isNextDisabled?: boolean;
}

// 링크 자체 패딩(위아래 8)에 더해 최소 44pt 터치 영역을 보장한다.
const linkHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

function SigninForm({
  title,
  description,
  children,
  onBack,
  onNext,
  nextButtonText = '다음',
  isNextDisabled = false,
}: SigninFormProps) {
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
            <TouchableOpacity className="flex-row items-center" onPress={onBack || router.back}>
              <BackArrow />
              <Text className="ml-2 text-gray-500">뒤로</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text className="text-3xl font-bold">{title}</Text>
            <Text className="mt-4 text-lg text-gray-700">{description}</Text>
          </View>

          <View className="mt-8">{children}</View>

          <View className="mt-4 flex-row justify-center gap-1">
            <TouchableOpacity
              testID="SigninForm-find-nickname-link"
              accessibilityRole="link"
              hitSlop={linkHitSlop}
              className="px-2 py-2"
              onPress={() => router.push('/findNickname')}>
              <Text className="text-body4 text-gray-500 underline">별칭 찾기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="SigninForm-reset-password-link"
              accessibilityRole="link"
              hitSlop={linkHitSlop}
              className="px-2 py-2"
              onPress={() => router.push('/resetPassword')}>
              <Text className="text-body4 text-gray-500 underline">비밀번호 변경하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <KeyboardStickyView offset={{ opened: insets.bottom }}>
        <View className="bg-white px-5 pb-3 pt-5">
          <Button testID="SigninForm-next-button" onPress={onNext} disabled={isNextDisabled}>
            {nextButtonText}
          </Button>
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}

export default memo(SigninForm);
