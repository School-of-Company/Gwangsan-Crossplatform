import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore(Keychain/Keystore)에 저장해야 하는 키. 나머지는 AsyncStorage에 저장한다.
export const SECURE_KEYS: ReadonlySet<string> = new Set(['accessToken', 'refreshToken']);

// 백그라운드 채팅 작업은 주로 기기가 잠긴 동안 실행되므로, iOS 키체인 토큰을 첫 잠금 해제 이후에는
// 읽을 수 있게 저장한다. expo-secure-store는 이미 있는 항목에 값만 덮어쓰고 접근성은 바꾸지 않아서
// 별도 서비스에 새 항목으로 저장한다. Android Keystore는 기기 잠금과 무관해 기존 그대로 둔다
export const TOKEN_STORE_OPTIONS: SecureStore.SecureStoreOptions | undefined =
  Platform.OS === 'ios'
    ? {
        keychainService: 'gwangsan.tokens.afterFirstUnlock',
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      }
    : undefined;
