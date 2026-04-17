import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

const SECURE_KEYS = new Set(['accessToken', 'refreshToken']);

export const getData = async (name: string): Promise<string | null> => {
  try {
    if (SECURE_KEYS.has(name)) {
      return await SecureStore.getItemAsync(name);
    }
    return await AsyncStorage.getItem(name);
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: '오류 발생',
      text2: `데이터를 가져오는 중 오류가 발생했습니다`,
    });

    throw e;
  }
};
