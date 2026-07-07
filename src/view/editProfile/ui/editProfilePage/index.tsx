import { ScrollView, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SpecialtiesDropdown } from '~/entity/auth';
import { Button, Header, Input } from '~/shared/ui';
import { TextField } from '~/shared/ui/TextField';

export default function EditProfilePageView() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="프로필 수정" />

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 200 }}>
        <View className="mt-3 flex gap-5">
          <Input label="별칭" />
          <SpecialtiesDropdown items={[]} label="특기" />
          <TextField label="자기소개" />
        </View>
      </ScrollView>

      <KeyboardStickyView offset={{ opened: insets.bottom }}>
        <View className="bg-white px-5 pt-5">
          <Button>수정</Button>
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
