import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

const SECURE_KEYS = new Set(['accessToken', 'refreshToken']);

export const removeData = async (name: string): Promise<void> => {
  try {
    if (SECURE_KEYS.has(name)) {
      await SecureStore.deleteItemAsync(name);
      return;
    }
    await AsyncStorage.removeItem(name);
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: '오류 발생',
      text2: `데이터를 삭제하는 중 오류가 발생했습니다`,
    });

    throw e;
  }
};
