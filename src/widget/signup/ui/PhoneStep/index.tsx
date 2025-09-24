import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { Text, View } from 'react-native';
import { usePhoneVerification } from '../../../../entity/auth/model/usePhoneVerification';

export default function PhoneStep() {
  const { value: initialPhoneNumber, updateField: updatePhoneNumber } =
    useSignupFormField('phoneNumber');
  const { value: initialVerificationCode, updateField: updateVerificationCode } =
    useSignupFormField('verificationCode');
  const { nextStep } = useSignupStepNavigation();

  const handleVerificationSuccess = (phoneNumber: string, verificationCode: string) => {
    updatePhoneNumber(phoneNumber);
    updateVerificationCode(verificationCode);
    nextStep();
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
    isVerificationComplete,
    verificationRef,
  } = usePhoneVerification({
    initialPhoneNumber: initialPhoneNumber as string,
    initialVerificationCode: initialVerificationCode as string,
    onSuccess: handleVerificationSuccess,
  });

  return (
    <SignupForm
      title="회원가입"
      description="전화번호를 입력해주세요"
      onNext={verifyCode}
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
          <Button
            className={`h-16 items-center justify-center rounded-xl px-8 ${
              buttonState.canSend ? 'bg-[#8FC31D]' : 'bg-gray-300'
            }`}
            onPress={requestVerification}
            disabled={buttonState.isDisabled}>
            <Text className="font-medium text-white">{buttonState.text}</Text>
          </Button>
        </View>
        <ErrorMessage error={phoneError} />
      </View>

      {verificationState.isVerifying && (
        <View className="mt-4">
          <Input
            ref={verificationRef}
            label="전화번호 인증"
            placeholder="인증번호를 입력해주세요"
            value={verificationCode}
            onChangeText={handleVerificationChange}
            onSubmitEditing={handleVerificationSubmit}
            keyboardType="numeric"
            returnKeyType="done"
            editable={!verificationState.isVerifyingCode}
            maxLength={6}
          />
          <ErrorMessage error={verificationError} />
        </View>
      )}
    </SignupForm>
  );
}
