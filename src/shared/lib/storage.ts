import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

export const SECURE_KEYS = new Set(['accessToken', 'refreshToken']);

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

export const setData = async (name: string, data: string): Promise<void> => {
  try {
    if (SECURE_KEYS.has(name)) {
      await SecureStore.setItemAsync(name, data);
      return;
    }
    await AsyncStorage.setItem(name, data);
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: '오류 발생',
      text2: `데이터를 저장하는 중 오류가 발생했습니다`,
    });

    throw e;
  }
};

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
