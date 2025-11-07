import { Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import { Svg, Path } from 'react-native-svg';

export function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="relative bottom-0 w-full flex-row justify-between border-t border-gray-200 bg-white px-6 py-3">
      <TouchableOpacity className="flex items-center" onPress={() => router.push('/main')}>
        <Ionicons
          name="home-outline"
          size={24}
          color={pathname === '/main' ? '#8FC31D' : '#8F9094'}
        />
        <Text className={pathname === '/main' ? 'text-[#8FC31D]' : 'text-gray-500'}>홈</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex items-center" onPress={() => router.push('/chatting')}>
        <Ionicons
          name="chatbubble-outline"
          size={24}
          color={pathname === '/chatting' ? '#8FC31D' : '#8F9094'}
        />
        <Text className={pathname === '/chatting' ? 'text-[#8FC31D]' : 'text-gray-500'}>채팅</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex items-center" onPress={() => router.push('/write')}>
        <Svg width={33} height={32} viewBox="0 0 33 32" fill="none">
          <Path
            d="M16.5 0C7.67785 0 0.5 7.17785 0.5 16C0.5 24.8222 7.67785 32 16.5 32C25.3222 32 32.5 24.8222 32.5 16C32.5 7.17785 25.3222 0 16.5 0ZM16.5 2.46154C23.9917 2.46154 30.0385 8.50831 30.0385 16C30.0385 23.4917 23.9917 29.5385 16.5 29.5385C9.00831 29.5385 2.96154 23.4917 2.96154 16C2.96154 8.50831 9.00831 2.46154 16.5 2.46154ZM15.2692 8.61539V14.7692H9.11539V17.2308H15.2692V23.3846H17.7308V17.2308H23.8846V14.7692H17.7308V8.61539H15.2692Z"
            fill="black"
          />
        </Svg>
      </TouchableOpacity>
      <TouchableOpacity className="flex items-center" onPress={() => router.push('/notice')}>
        <Ionicons
          name="megaphone-outline"
          size={24}
          color={pathname === '/notice' ? '#8FC31D' : '#8F9094'}
        />
        <Text className={pathname === '/notice' ? 'text-[#8FC31D]' : 'text-gray-500'}>공지</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex items-center" onPress={() => router.push('/profile')}>
        <Ionicons
          name="person-outline"
          size={24}
          color={pathname === '/profile' ? '#8FC31D' : '#8F9094'}
        />
        <Text
          testID="Footer-profile-button"
          className={pathname === '/profile' ? 'text-[#8FC31D]' : 'text-gray-500'}>
          프로필
        </Text>
      </TouchableOpacity>
    </View>
  );
}
