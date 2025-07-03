import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';
import { SigninPage } from '~/app/signin/page';
import { SignupPage } from '~/app/signup/page';
import { Onboarding } from '~/app/onboarding/page';
import { Keyboard, Pressable } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Pressable className="flex-1 bg-white p-6" onPress={Keyboard.dismiss}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={Onboarding} />
          <Stack.Screen name="Signup" component={SignupPage} />
          <Stack.Screen name="Signin" component={SigninPage} />
        </Stack.Navigator>
      </Pressable>
    </NavigationContainer>
  );
}
