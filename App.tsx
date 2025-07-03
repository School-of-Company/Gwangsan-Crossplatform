import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';
import { SigninPage } from '~/app/signin/page';
import { SignupPage } from '~/app/signup/page';
import { Onboarding } from '~/app/onboarding/page';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding">
        <Stack.Screen options={{ headerShown: false }} name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Signin" component={SigninPage} />
        <Stack.Screen name="Signup" component={SignupPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
