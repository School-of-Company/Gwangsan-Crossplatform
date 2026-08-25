import { Image, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ProfileHeaderProps {
  name?: string;
  isMe: boolean;
  isMenuDisabled: boolean;
  onEditProfile: () => void;
  onMenuPress: () => void;
}

export default function ProfileHeader({
  name,
  isMe,
  isMenuDisabled,
  onEditProfile,
  onMenuPress,
}: ProfileHeaderProps) {
  if (isMe) {
    return (
      <TouchableOpacity
        testID="Information-edit-button"
        onPress={onEditProfile}
        className="mx-6 mb-3 flex flex-row items-center justify-between rounded-xl bg-[#F3F4F5] p-6">
        <View className="flex flex-row items-center gap-4">
          <Image
            source={require('~/shared/assets/png/defaultProfile.png')}
            width={50}
            height={50}
            resizeMode="contain"
            className="rounded-full"
          />
          <Text testID="Information-nickname" className="text-body1">
            {name ?? '사용자'}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>
    );
  }

  return (
    <View className="mx-6 mb-3 flex flex-row justify-between rounded-xl bg-[#F3F4F5] p-6">
      <View className="flex flex-row gap-4">
        <Image
          source={require('~/shared/assets/png/defaultProfile.png')}
          width={50}
          height={50}
          resizeMode="contain"
          className="rounded-full"
        />
        <View className="flex-row items-center gap-4">
          <Text testID="Information-nickname" className="text-body1">
            {name ?? '사용자'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onMenuPress}
        disabled={isMenuDisabled}
        className="flex justify-center px-2 py-2">
        <MaterialIcons name="more-vert" size={28} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}
