// SecureStore(Keychain/Keystore)에 저장해야 하는 키. 나머지는 AsyncStorage에 저장한다.
export const SECURE_KEYS: ReadonlySet<string> = new Set(['accessToken', 'refreshToken']);
