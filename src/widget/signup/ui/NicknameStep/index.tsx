import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import { nicknameSchema } from '~/entity/signup/model/signupSchema';
import { Text, View } from 'react-native';
import { ZodError } from 'zod';

export default function NicknameStep() {
  const { formData, setField, nextStep } = useSignupStore();
  const [nickname, setNickname] = useState(formData.nickname);
  const [error, setError] = useState<string | null>(null);

  const validateAndNext = () => {
    try {
      nicknameSchema.parse(nickname);
      setError(null);
      setField('nickname', nickname);
      nextStep();
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('유효하지 않은 별칭입니다');
      }
    }
  };

  return (
    <SignupForm
      title="회원가입"
      description="별칭을 입력해주세요"
      onNext={validateAndNext}
      isNextDisabled={nickname.trim() === ''}>
      <View>
        <Input
          label="별칭"
          placeholder="별칭을 입력해주세요"
          value={nickname}
          onChangeText={(text) => {
            setNickname(text);
            setError(null);
          }}
        />
        <View className="h-6">{error && <Text className="text-red-500">{error}</Text>}</View>
      </View>
    </SignupForm>
  );
}
