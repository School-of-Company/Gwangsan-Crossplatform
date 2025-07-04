import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import { phoneSchema, verificationCodeSchema } from '@/entity/signup/model/validationSchema';
import { Text, View } from 'react-native';
import { ZodError } from 'zod';

export default function PhoneStep() {
  const { formData, setField, nextStep } = useSignupStore();
  const [phone, setPhone] = useState(formData.phone);
  const [verificationCode, setVerificationCode] = useState(formData.verificationCode);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const requestVerification = () => {
    try {
      phoneSchema.parse(phone);
      // TODO: /api/sms 요청
      setPhoneError(null);
      setIsVerifying(true);
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
      
      setField('phone', phone);
      setField('verificationCode', verificationCode);
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
  
  return (
    <SignupForm
      title="회원가입"
      description="전화번호를 입력해주세요"
      onNext={validateAndNext}
      isNextDisabled={!isVerifying || verificationCode.trim() === ''}
    >
      <View>
        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <Input
              label="전화번호"
              placeholder="전화번호를 입력해주세요"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError(null);
                setIsVerifying(false);
              }}
              keyboardType="numeric"
              maxLength={11}
            />
          </View>
          <Button 
            className={`h-16 items-center justify-center rounded-xl px-8 ${
              phone.length === 11 ? 'bg-[#8FC31D]' : 'bg-gray-300'
            }`}
            onPress={requestVerification}
            disabled={phone.length !== 11}
          >
            <Text className="text-white font-medium">인증</Text>
          </Button>
        </View>
        <View className="h-6">
          {phoneError && (
            <Text className="text-red-500">{phoneError}</Text>
          )}
        </View>
      </View>
      
      {isVerifying && (
        <View className="mt-4">
          <Input
            label="전화번호 인증"
            placeholder="인증번호를 입력해주세요"
            value={verificationCode}
            onChangeText={(text) => {
              setVerificationCode(text);
              setVerificationError(null);
            }}
            keyboardType="numeric"
          />
          <View className="h-6">
            {verificationError && (
              <Text className="text-red-500">{verificationError}</Text>
            )}
          </View>
        </View>
      )}
    </SignupForm>
  );
}