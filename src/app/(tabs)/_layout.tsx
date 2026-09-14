import { Tabs } from 'expo-router';
import { AppFooter } from '~/widget/write/ui/AppFooter';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppFooter {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="main" />
      <Tabs.Screen name="chatting" />
      <Tabs.Screen name="notice" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
