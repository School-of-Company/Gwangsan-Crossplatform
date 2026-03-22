import { useState } from 'react';
import { TextField } from '@/shared/ui/TextField';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { descriptionSchema } from '~/entity/auth/model/authSchema';
import { View } from 'react-native';
import { ZodError } from 'zod';

export default function DescriptionStep() {
  const { value: initialDescription, updateField } = useSignupFormField('description');
  const { nextStep } = useSignupStepNavigation();
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);

  const validateAndNext = () => {
    try {
      descriptionSchema.parse(description);
      setError(null);
      updateField(description);
      nextStep();
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('유효하지 않은 자기소개입니다');
      }
    }
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    if (description.trim().length >= 1) {
      validateAndNext();
    }
  };

  return (
    <SignupForm
      title="회원가입"
      description="자신을 소개하는 글을 작성해주세요"
      onNext={validateAndNext}
      isNextDisabled={description.trim().length < 1}>
      <View>
        <TextField
          label="자기소개"
          placeholder="자신을 소개하는 글을 작성해주세요."
          value={description}
          onChangeText={handleDescriptionChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          multiline={true}
          numberOfLines={6}
          maxLength={500}
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}
