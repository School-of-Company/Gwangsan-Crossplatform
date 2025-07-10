import { useState, useRef } from 'react';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useFormField, useStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { phoneSchema, verificationCodeSchema } from '~/entity/auth/model/authSchema';
import { sendSms } from '~/entity/auth/api/sendSms';
import { verifySms } from '~/entity/auth/api/verifySms';
import { Text, View, TextInput } from 'react-native';
import { ZodError } from 'zod';
import Toast from 'react-native-toast-message';

export default function PhoneStep() {
  const { value: initialPhoneNumber, updateField: updatePhoneNumber } = useFormField('phoneNumber');
  const { value: initialVerificationCode, updateField: updateVerificationCode } =
    useFormField('verificationCode');
  const { nextStep } = useStepNavigation();

  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [verificationCode, setVerificationCode] = useState(initialVerificationCode);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const verificationRef = useRef<TextInput>(null);

  const requestVerification = async () => {
    try {
      phoneSchema.parse(phoneNumber);
      setPhoneError(null);
      setIsSendingCode(true);

      await sendSms(phoneNumber);

      setIsVerifying(true);
      setIsVerificationSent(true);

      Toast.show({
        type: 'success',
        text1: '인증번호 전송 완료',
        text2: '전화번호로 인증번호가 전송되었습니다.',
      });

      setTimeout(() => {
        verificationRef.current?.focus();
      }, 100);
    } catch (err) {
      if (err instanceof ZodError) {
        setPhoneError(err.errors[0].message);
      } else if (err instanceof Error) {
        setPhoneError(err.message);
        Toast.show({
          type: 'error',
          text1: '인증번호 전송 실패',
          text2: err.message,
        });
      } else {
        setPhoneError('유효하지 않은 전화번호입니다');
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const validateAndNext = async () => {
    if (!isVerifying) {
      setPhoneError('인증을 먼저 진행해주세요');
      return;
    }

    try {
      verificationCodeSchema.parse(verificationCode);
      setVerificationError(null);
      setIsVerifyingCode(true);

      await verifySms(phoneNumber, verificationCode);

      updatePhoneNumber(phoneNumber);
      updateVerificationCode(verificationCode);

      Toast.show({
        type: 'success',
        text1: '인증 완료',
        text2: '전화번호 인증이 완료되었습니다.',
      });

      nextStep();
    } catch (err) {
      if (err instanceof ZodError) {
        setVerificationError(err.errors[0].message);
      } else if (err instanceof Error) {
        setVerificationError('인증번호가 일치하지 않습니다');
        Toast.show({
          type: 'error',
          text1: '인증 실패',
          text2: '인증번호가 일치하지 않습니다. 다시 확인해주세요.',
        });
      } else {
        setVerificationError('유효하지 않은 인증번호입니다');
      }
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    if (phoneError) setPhoneError(null);
    setIsVerifying(false);
    setIsVerificationSent(false);
  };

  const handleVerificationChange = (text: string) => {
    setVerificationCode(text);
    if (verificationError) setVerificationError(null);
  };

  const handlePhoneSubmit = () => {
    if (phoneNumber.length === 11) {
      requestVerification();
    }
  };

  const handleVerificationSubmit = () => {
    if (verificationCode.trim() !== '') {
      validateAndNext();
    }
  };

  return (
    <SignupForm
      title="회원가입"
      description="전화번호를 입력해주세요"
      onNext={validateAndNext}
      isNextDisabled={!isVerifying || verificationCode.trim() === '' || isVerifyingCode}>
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
              editable={!isSendingCode}
            />
          </View>
          <Button
            className={`h-16 items-center justify-center rounded-xl px-8 ${
              phoneNumber.length === 11 && !isSendingCode ? 'bg-[#8FC31D]' : 'bg-gray-300'
            }`}
            onPress={requestVerification}
            disabled={phoneNumber.length !== 11 || isSendingCode || isVerifyingCode}>
            <Text className="font-medium text-white">
              {isSendingCode ? '전송중...' : isVerificationSent ? '재전송' : isVerifyingCode ? '인증중...' : '인증'}
            </Text>
          </Button>
        </View>
        <ErrorMessage error={phoneError} />
      </View>

      {isVerifying && (
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
            editable={!isVerifyingCode}
          />
          <ErrorMessage error={verificationError} />
        </View>
      )}
    </SignupForm>
  );
}
