import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS } from './secureKeys';

// 저장소 헬퍼는 요청 인터셉터·소켓·백그라운드 태스크 등 여러 곳에서 쓰이므로 UI(토스트)를 띄우지
// 않고 실패를 그대로 던져 호출한 쪽이 처리하게 한다. 기기가 잠겨 SecureStore 접근이 실패할 때
// 요청마다 토스트가 뜨던 문제가 있었다(#737)
export const getData = async (name: string): Promise<string | null> => {
  if (SECURE_KEYS.has(name)) {
    return await SecureStore.getItemAsync(name);
  }
  return await AsyncStorage.getItem(name);
};
