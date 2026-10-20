import { View, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, Input, Button } from '~/shared/ui';
import { TextField } from '~/shared/ui/TextField';
import { Dropdown } from '@/shared/ui/Dropdown';
import SpecialtiesDropdown from '~/entity/auth/ui/SpecialtiesDropdown';
import { SPECIALTIES } from '~/shared/consts/specialties';
import { PLACE_ITEMS } from '@/shared/consts/place';
import { useGetMyProfile } from '../../model/useGetMyProfile';
import { useUpdateProfile } from '../../model/useUpdateProfile';
import { useUpdateBranch } from '../../model/useUpdateBranch';
import { profileEditSchema } from '~/entity/auth/model/authSchema';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

const PLACE_DROPDOWN_ITEMS = PLACE_ITEMS.map((item) => ({
  value: String(item.id),
  label: item.name,
}));

export default function ProfileEditPageView() {
  const [nickname, setNickname] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [placeId, setPlaceId] = useState<string | undefined>(undefined);
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);

  const { data: profileData, isLoading } = useGetMyProfile(true);
  const updateProfileMutation = useUpdateProfile();
  const updateBranchMutation = useUpdateBranch();
  const insets = useSafeAreaInsets();

  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (profileData && !hasInitializedRef.current) {
      hasInitializedRef.current = true;

      setNickname(profileData.nickname || '');

      setSpecialties(profileData.specialties || []);

      setDescription(profileData.description || '');

      const currentPlace = PLACE_ITEMS.find((item) => item.name === profileData.placeName);
      setPlaceId(currentPlace ? String(currentPlace.id) : undefined);
    }
  }, [profileData]);

  const handleBranchSelect = (selectedPlaceIdStr: string) => {
    if (selectedPlaceIdStr === placeId) return;
    const previousPlaceId = placeId;
    setPlaceId(selectedPlaceIdStr);
    // 실패하면 드롭다운을 이전 지점으로 되돌린다. 안 그러면 서버엔 반영되지 않았는데
    // 화면엔 바뀐 지점이 남아 바뀐 것처럼 보였다(Gwangsan-Server#448)
    updateBranchMutation.mutate(
      { placeId: parseInt(selectedPlaceIdStr, 10) },
      { onError: () => setPlaceId(previousPlaceId) }
    );
  };

  const handleSubmit = () => {
    // 별칭을 바꾸지 않았으면 서버에 저장된 원본을 그대로 보낸다. 서버는 본인 별칭을 문자열 비교로
    // 걸러내지만 중복 검사는 공백·대소문자를 무시하는 DB 비교라, 앞뒤 공백이 붙어 저장된 별칭을
    // trim해서 보내면 자기 자신과 충돌해 409가 났다(#780). 기존 별칭은 정규식 검사도 건너뛴다.
    const originalNickname = profileData?.nickname ?? '';
    const isNicknameUnchanged = !!originalNickname && nickname.trim() === originalNickname.trim();
    const schema = isNicknameUnchanged
      ? profileEditSchema.extend({ nickname: z.string() })
      : profileEditSchema;

    try {
      const validatedData = schema.parse({
        nickname: isNicknameUnchanged ? originalNickname : nickname.trim(),
        specialties,
        description: description.trim(),
      });

      updateProfileMutation.mutate(validatedData);
    } catch (error: any) {
      if (error.issues && error.issues.length > 0) {
        Toast.show({
          type: 'error',
          text1: '입력 오류',
          text2: error.issues[0].message,
        });
      }
    }
  };

  const isFormValid = nickname.trim() && specialties.length > 0 && description.trim();
  const isSubmitting = updateProfileMutation.isPending;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header headerTitle="내 정보 수정" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header headerTitle="내 정보 수정" />

      <KeyboardAwareScrollView
        style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}
        contentContainerStyle={{ paddingBottom: 200 }}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}>
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
            onCustomInputVisibleChange={setIsCustomInputOpen}
          />

          <Dropdown
            label="지점"
            items={PLACE_DROPDOWN_ITEMS}
            selectedItem={placeId}
            onSelect={handleBranchSelect}
            placeholder="지점을 선택해주세요"
          />

          <TextField
            label="자기소개"
            placeholder="자신을 소개해주세요"
            value={description}
            onChangeText={setDescription}
            maxLength={300}
          />
        </View>
      </KeyboardAwareScrollView>

      {!isCustomInputOpen && (
        <KeyboardStickyView offset={{ opened: insets.bottom }}>
          <View className="bg-background px-5 pb-3 pt-5">
            <Button onPress={handleSubmit} disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? '수정 중...' : '수정'}
            </Button>
          </View>
        </KeyboardStickyView>
      )}
    </SafeAreaView>
  );
}
