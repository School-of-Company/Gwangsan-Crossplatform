import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS, TOKEN_STORE_OPTIONS } from './secureKeys';

// 저장소 헬퍼는 요청 인터셉터·소켓·백그라운드 태스크 등 여러 곳에서 쓰이므로 UI(토스트)를 띄우지
// 않고 실패를 그대로 던져 호출한 쪽이 처리하게 한다 (기기가 잠기면 SecureStore 접근이 요청마다 실패한다)
export const setData = async (name: string, data: string): Promise<void> => {
  if (SECURE_KEYS.has(name)) {
    // 기본 서비스의 예전 항목은 여기서 지우지 않는다. 지우는 사이에 읽는 쪽이 두 곳 모두에서 토큰을
    // 못 찾으면 로그아웃될 수 있고, 새 항목이 생기면 getData는 예전 항목을 읽지 않는다
    await SecureStore.setItemAsync(name, data, TOKEN_STORE_OPTIONS);
    return;
  }
  await AsyncStorage.setItem(name, data);
};
