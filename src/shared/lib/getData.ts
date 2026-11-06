import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS, TOKEN_STORE_OPTIONS } from './secureKeys';

// 저장소 헬퍼는 요청 인터셉터·소켓·백그라운드 태스크 등 여러 곳에서 쓰이므로 UI(토스트)를 띄우지
// 않고 실패를 그대로 던져 호출한 쪽이 처리하게 한다 (기기가 잠기면 SecureStore 접근이 요청마다 실패한다)
export const getData = async (name: string): Promise<string | null> => {
  if (SECURE_KEYS.has(name)) {
    if (!TOKEN_STORE_OPTIONS) return await SecureStore.getItemAsync(name);
    const value = await SecureStore.getItemAsync(name, TOKEN_STORE_OPTIONS);
    if (value !== null) return value;
    // 새 서비스에 아직 저장된 적 없는 토큰은 기본 서비스에 남아 있다. 다음 저장 때 새 서비스로 옮겨진다
    return await SecureStore.getItemAsync(name);
  }
  return await AsyncStorage.getItem(name);
};
