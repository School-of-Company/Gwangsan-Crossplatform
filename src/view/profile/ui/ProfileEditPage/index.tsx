import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Input, Button } from '~/shared/ui';
import { TextField } from '~/shared/ui/TextField';
import SpecialtiesDropdown from '~/entity/auth/ui/SpecialtiesDropdown';
import { SPECIALTIES } from '~/shared/consts/specialties';
import { useGetMyProfile } from '../../model/useGetMyProfile';
import { useUpdateProfile } from '../../model/useUpdateProfile';
import { profileEditSchema } from '~/entity/auth/model/authSchema';
import Toast from 'react-native-toast-message';

export default function ProfileEditPageView() {
  const [nickname, setNickname] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const { data: profileData, isLoading } = useGetMyProfile(true);
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (profileData) {
      setNickname(profileData.nickname || '');
      setSpecialties(profileData.specialties || []);
      setDescription(profileData.description || '');
    }
  }, [profileData]);

  const handleSubmit = () => {
    try {
      const validatedData = profileEditSchema.parse({
        nickname: nickname.trim(),
        specialties,
        description: description.trim(),
      });

      updateProfileMutation.mutate(validatedData);
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        Toast.show({
          type: 'error',
          text1: '입력 오류',
          text2: error.errors[0].message,
        });
      }
    }
  };

  const isFormValid = nickname.trim() && specialties.length > 0 && description.trim();
  const isSubmitting = updateProfileMutation.isPending;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header headerTitle="내 정보 수정" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="내 정보 수정" />

      <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          <Input
            label="별칭"
            placeholder="별칭을 입력해주세요"
            value={nickname}
            onChangeText={setNickname}
            maxLength={20}
          />

          <SpecialtiesDropdown
            label="특기"
            items={SPECIALTIES}
            placeholder="특기를 선택해주세요"
            selectedItems={specialties}
            onSelect={setSpecialties}
            allowCustomInput={true}
          />

          <TextField
            label="자기소개"
            placeholder="자신을 소개해주세요"
            value={description}
            onChangeText={setDescription}
            maxLength={300}
          />
        </View>
      </ScrollView>

      <View className="px-6 pb-6">
        <Button onPress={handleSubmit} disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? '수정 중...' : '수정'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
