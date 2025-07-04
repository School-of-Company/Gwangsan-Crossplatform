import { View, Text, TouchableOpacity } from 'react-native';
import { Button } from '@/shared/ui/Button';
import { ReactNode } from 'react';
import { useSignupStore } from '@/entity/signup/model/signupStore';

interface SignupFormProps {
  title: string;
  description: string;
  children: ReactNode;
  onNext: () => void;
  nextButtonText?: string;
  isNextDisabled?: boolean;
}

export default function SignupForm({
  title,
  description,
  children,
  onNext,
  nextButtonText = '다음',
  isNextDisabled = false,
}: SignupFormProps) {
  const prevStep = useSignupStore((state) => state.prevStep);
  
  return (
    <View className="flex-1 bg-white px-6 gap-8">
      <View className="mt-12 flex-row items-center">
        <TouchableOpacity onPress={() => prevStep()}>
          <Text className="ml-2 text-gray-500">← 뒤로</Text>
        </TouchableOpacity>
      </View>
      
      <View>
        <Text className="text-3xl font-bold">{title}</Text>
        <Text className="mt-4 text-lg text-gray-700">{description}</Text>
      </View>
      
      <View className="mt-8">
        {children}
      </View>
      
      <View className="mt-auto mb-8">
        <Button
          onPress={onNext}
          disabled={isNextDisabled}
        >
          {nextButtonText}
        </Button>
      </View>
    </View>
  );
}