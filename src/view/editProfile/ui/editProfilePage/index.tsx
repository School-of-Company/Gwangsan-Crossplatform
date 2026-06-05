import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpecialtiesDropdown } from '~/entity/auth';
import { Button, Header, Input } from '~/shared/ui';
import { TextField } from '~/shared/ui/TextField';

export default function EditProfilePageView() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle="프로필 수정" />

      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="mt-3 flex gap-5">
            <Input label="별칭" />
            <SpecialtiesDropdown items={[]} label="특기" />
            <TextField label="자기소개" />
          </View>
        </ScrollView>

        <View className="px-6 pb-6">
          <Button>수정</Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
