import { Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import { getData } from '~/shared/lib/getData';

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  const id = getData('memberId');

  const FooterItem = [
    { label: '홈', icon: 'home-outline', pathname: '/main' },
    { label: '채팅', icon: 'chatbubble-outline', pathname: '/chating' },
    { label: '공지', icon: 'megaphone-outline', pathname: '/notice' },
    { label: '프로필', icon: 'person-outline', pathname: '/profile/' + id },
  ];

  return (
    <View className="relative bottom-0 w-full flex-row justify-between border-t border-gray-200 bg-white px-6 py-3">
      {FooterItem.map((v) => {
        const focused = pathname === v.pathname;
        return (
          <TouchableOpacity
            key={v.pathname}
            className="flex items-center"
            onPress={() => {
              if (!focused) router.push(v.pathname);
            }}>
            <Ionicons name={v.icon} size={24} color={focused ? '#8FC31D' : '#8F9094'} />
            <Text className={focused ? 'text-[#8FC31D]' : 'text-gray-500'}>{v.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
