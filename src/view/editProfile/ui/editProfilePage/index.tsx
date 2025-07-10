import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpecialtiesDropdown } from '~/entity/auth';
import { Button, Header, Input } from '~/shared/ui';
import { TextField } from '~/shared/ui/TextField';

export default function EditProfilePageView() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="프로필 수정" />

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mt-3 flex gap-5">
          <Input label="별칭" />
          <SpecialtiesDropdown items={[]} label="특기" />
          <TextField label="자기소개" />
        </View>
      </ScrollView>

      <View className="absolute bottom-6 left-6 right-6">
        <Button>수정</Button>
      </View>
    </SafeAreaView>
  );
}
