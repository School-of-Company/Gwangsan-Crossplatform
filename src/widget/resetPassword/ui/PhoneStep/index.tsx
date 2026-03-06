import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import ResetPasswordForm from '~/entity/auth/ui/ResetPasswordForm';
import {
  useResetPasswordFormField,
  useResetPasswordStepNavigation,
} from '~/entity/auth/model/useAuthSelectors';
import { View } from 'react-native';
import { usePasswordResetPhoneVerification } from '~/entity/auth/model/usePasswordResetPhoneVerification';
import { router } from 'expo-router';

export default function PhoneStep() {
  const { value: initialPhoneNumber, updateField: updatePhoneNumber } =
    useResetPasswordFormField('phoneNumber');
  const { value: initialVerificationCode, updateField: updateVerificationCode } =
    useResetPasswordFormField('verificationCode');
  const { nextStep, resetStore } = useResetPasswordStepNavigation();

  const handleBack = () => {
    resetStore();
    router.replace('/onboarding');
  };

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
  } = usePasswordResetPhoneVerification({
    initialPhoneNumber: initialPhoneNumber as string,
    initialVerificationCode: initialVerificationCode as string,
  });

  const handleNext = () => {
    updatePhoneNumber(phoneNumber);
    updateVerificationCode(verificationCode);
    nextStep();
  };

  return (
    <ResetPasswordForm
      title="비밀번호 재설정"
      description="가입 시 등록한 전화번호를 입력해주세요"
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={!isVerificationComplete}>
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
          <Button width="w-auto" onPress={requestVerification} disabled={buttonState.isDisabled}>
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
            <Button width="w-auto" onPress={verifyCode} disabled={verifyButtonState.isDisabled}>
              {verifyButtonState.text}
            </Button>
          </View>
          <ErrorMessage error={verificationError} />
        </View>
      )}
    </ResetPasswordForm>
  );
}
