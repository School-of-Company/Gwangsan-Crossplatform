import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import BackArrow from '@/shared/assets/svg/BackArrow';
import { useFindNicknamePhoneVerification } from '~/entity/auth/model/useFindNicknamePhoneVerification';
import { findNickname } from '~/entity/auth/api/findNickname';
import { useState } from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function FindNicknamePage() {
  const [foundNickname, setFoundNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    phoneNumber,
    verificationCode,
    phoneError,
    verificationError,
    verificationState,
    handlePhoneChange,
    handleVerificationChange,
    handlePhoneSubmit,
    handleVerificationSubmit,
    requestVerification,
    verifyCode,
    buttonState,
    verifyButtonState,
    isVerificationComplete,
    verificationRef,
  } = useFindNicknamePhoneVerification();

  const handleFindNickname = async () => {
    setIsLoading(true);
    try {
      const nickname = await findNickname(phoneNumber);
      setFoundNickname(nickname);
    } catch {
      Toast.show({ type: 'error', text1: '별칭 찾기 실패', text2: '별칭을 찾을 수 없습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (foundNickname) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 gap-8 px-6">
          <View className="flex-row items-center pt-4">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.replace('/onboarding')}>
              <BackArrow />
              <Text className="ml-2 text-gray-500">뒤로</Text>
            </TouchableOpacity>
          </View>
          <View>
            <Text className="text-3xl font-bold">별칭 찾기 완료</Text>
            <Text className="mt-4 text-lg text-gray-700">
              입력하신 전화번호로 등록된 별칭입니다.
            </Text>
          </View>
          <View className="mt-8 rounded-xl bg-gray-100 p-6">
            <Text className="text-center text-sm text-gray-500">별칭</Text>
            <Text className="mt-2 text-center text-2xl font-bold">{foundNickname}</Text>
          </View>
          <View className="mb-8 mt-auto">
            <Button onPress={() => router.replace('/signin')}>로그인하러 가기</Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-8 px-6">
            <View className="flex-row items-center pt-4">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => router.replace('/onboarding')}>
                <BackArrow />
                <Text className="ml-2 text-gray-500">뒤로</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-3xl font-bold">별칭 찾기</Text>
              <Text className="mt-4 text-lg text-gray-700">
                가입 시 등록한 전화번호를 입력해주세요
              </Text>
            </View>

            <View className="mt-8 flex-1">
              <View>
                <View className="flex-row items-end gap-2">
                  <View className="flex-1">
                    <Input
                      label="전화번호"
                      placeholder="전화번호를 입력해주세요"
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      onSubmitEditing={handlePhoneSubmit}
                      keyboardType="numeric"
                      maxLength={11}
                      returnKeyType="done"
                      editable={!verificationState.isSendingCode}
                    />
                  </View>
                  <Button
                    width="w-auto"
                    onPress={requestVerification}
                    disabled={buttonState.isDisabled}>
                    {buttonState.text}
                  </Button>
                </View>
                <ErrorMessage error={phoneError} />
              </View>

              {verificationState.isVerifying && (
                <View className="mt-4">
                  <View className="flex-row items-end gap-2">
                    <View className="flex-1">
                      <Input
                        ref={verificationRef}
                        label="전화번호 인증"
                        placeholder="인증번호를 입력해주세요"
                        value={verificationCode}
                        onChangeText={handleVerificationChange}
                        onSubmitEditing={handleVerificationSubmit}
                        keyboardType="numeric"
                        returnKeyType="done"
                        editable={!verificationState.isVerifyingCode && !isVerificationComplete}
                        maxLength={6}
                      />
                    </View>
                    <Button
                      width="w-auto"
                      onPress={verifyCode}
                      disabled={verifyButtonState.isDisabled}>
                      {verifyButtonState.text}
                    </Button>
                  </View>
                  <ErrorMessage error={verificationError} />
                </View>
              )}
            </View>

            <View className="mb-8 mt-auto">
              <Button onPress={handleFindNickname} disabled={!isVerificationComplete || isLoading}>
                {isLoading ? '찾는 중...' : '별칭 찾기'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
