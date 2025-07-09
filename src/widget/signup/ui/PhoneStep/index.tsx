import { useState, useRef } from 'react';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useFormField, useStepNavigation } from '~/entity/signup/model/useSignupSelectors';
import { phoneSchema, verificationCodeSchema } from '~/entity/signup/model/authSchema';
import { Text, View, TextInput } from 'react-native';
import { ZodError } from 'zod';

export default function PhoneStep() {
  const { value: initialPhone, updateField: updatePhone } = useFormField('phone');
  const { value: initialVerificationCode, updateField: updateVerificationCode } =
    useFormField('verificationCode');
  const { nextStep } = useStepNavigation();

  const [phone, setPhone] = useState(initialPhone);
  const [verificationCode, setVerificationCode] = useState(initialVerificationCode);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verificationRef = useRef<TextInput>(null);

  const requestVerification = () => {
    try {
      phoneSchema.parse(phone);
      // TODO: /api/sms 요청
      setPhoneError(null);
      setIsVerifying(true);
      setTimeout(() => {
        verificationRef.current?.focus();
      }, 100);
    } catch (err) {
      if (err instanceof ZodError) {
        setPhoneError(err.errors[0].message);
      } else if (err instanceof Error) {
        setPhoneError(err.message);
      } else {
        setPhoneError('유효하지 않은 전화번호입니다');
      }
    }
  };

  const validateAndNext = () => {
    if (!isVerifying) {
      setPhoneError('인증을 먼저 진행해주세요');
      return;
    }

    try {
      verificationCodeSchema.parse(verificationCode);
      setVerificationError(null);

      updatePhone(phone);
      updateVerificationCode(verificationCode);
      nextStep();
    } catch (err) {
      if (err instanceof ZodError) {
        setVerificationError(err.errors[0].message);
      } else if (err instanceof Error) {
        setVerificationError(err.message);
      } else {
        setVerificationError('유효하지 않은 인증번호입니다');
      }
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (phoneError) setPhoneError(null);
    setIsVerifying(false);
  };

  const handleVerificationChange = (text: string) => {
    setVerificationCode(text);
    if (verificationError) setVerificationError(null);
  };

  const handlePhoneSubmit = () => {
    if (phone.length === 11) {
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
      isNextDisabled={!isVerifying || verificationCode.trim() === ''}>
      <View>
        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <Input
              label="전화번호"
              placeholder="전화번호를 입력해주세요"
              value={phone}
              onChangeText={handlePhoneChange}
              onSubmitEditing={handlePhoneSubmit}
              keyboardType="numeric"
              maxLength={11}
              returnKeyType="done"
            />
          </View>
          <Button
            className={`h-16 items-center justify-center rounded-xl px-8 ${
              phone.length === 11 ? 'bg-[#8FC31D]' : 'bg-gray-300'
            }`}
            onPress={requestVerification}
            disabled={phone.length !== 11}>
            <Text className="font-medium text-white">인증</Text>
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
          />
          <ErrorMessage error={verificationError} />
        </View>
      )}
    </SignupForm>
  );
}
