import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { getData } from '../getData';
import { setData } from '../setData';
import { removeData } from '../removeData';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// jest-expo 기본 플랫폼은 iOS다
const IOS_TOKEN_OPTIONS = {
  keychainService: 'gwangsan.tokens.afterFirstUnlock',
  keychainAccessible: 1,
};

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockToast = Toast as jest.Mocked<typeof Toast>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getData', () => {
  it('일반 키는 AsyncStorage에서 값을 반환한다', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('stored-value');

    const result = await getData('myKey');

    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('myKey');
    expect(result).toBe('stored-value');
  });

  it('값이 없으면 null을 반환한다', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const result = await getData('missingKey');

    expect(result).toBeNull();
  });

  it('accessToken은 잠금 후에도 읽을 수 있는 SecureStore 서비스에서 먼저 읽는다', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue('secure-token');

    const result = await getData('accessToken');

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledTimes(1);
    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('accessToken', IOS_TOKEN_OPTIONS);
    expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
    expect(result).toBe('secure-token');
  });

  it('새 서비스에 없으면 기본 서비스에 남아 있는 예전 토큰을 읽는다', async () => {
    mockSecureStore.getItemAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('legacy-refresh');

    const result = await getData('refreshToken');

    expect(mockSecureStore.getItemAsync).toHaveBeenNthCalledWith(
      1,
      'refreshToken',
      IOS_TOKEN_OPTIONS
    );
    expect(mockSecureStore.getItemAsync).toHaveBeenNthCalledWith(2, 'refreshToken');
    expect(result).toBe('legacy-refresh');
  });

  it('잠긴 키체인에서 예전 토큰을 읽다 실패하면 에러를 전파한다', async () => {
    mockSecureStore.getItemAsync
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('User interaction is not allowed.'));

    await expect(getData('accessToken')).rejects.toThrow('User interaction is not allowed.');
  });

  it('저장소가 실패하면 토스트 없이 에러를 전파한다(#737)', async () => {
    const storageError = new Error('Storage read failed');
    mockAsyncStorage.getItem.mockRejectedValue(storageError);

    await expect(getData('failKey')).rejects.toThrow('Storage read failed');
    expect(mockToast.show).not.toHaveBeenCalled();
  });
});

describe('setData', () => {
  it('일반 키는 AsyncStorage에 저장한다', async () => {
    mockAsyncStorage.setItem.mockResolvedValue();

    await setData('memberId', '42');

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('memberId', '42');
    expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('accessToken은 첫 잠금 해제 이후 읽을 수 있게 SecureStore에 저장한다', async () => {
    mockSecureStore.setItemAsync.mockResolvedValue();

    await setData('accessToken', 'abc123');

    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      'accessToken',
      'abc123',
      IOS_TOKEN_OPTIONS
    );
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('refreshToken을 저장할 때 기본 서비스의 예전 항목은 지우지 않는다', async () => {
    mockSecureStore.setItemAsync.mockResolvedValue();

    await setData('refreshToken', 'ref456');

    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      'refreshToken',
      'ref456',
      IOS_TOKEN_OPTIONS
    );
    expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('저장소가 실패하면 토스트 없이 에러를 전파한다(#737)', async () => {
    const storageError = new Error('Storage write failed');
    mockAsyncStorage.setItem.mockRejectedValue(storageError);

    await expect(setData('failKey', 'value')).rejects.toThrow('Storage write failed');
    expect(mockToast.show).not.toHaveBeenCalled();
  });
});

describe('removeData', () => {
  it('일반 키는 AsyncStorage에서 삭제한다', async () => {
    mockAsyncStorage.removeItem.mockResolvedValue();

    await removeData('memberId');

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('memberId');
    expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('accessToken은 새 서비스와 기본 서비스 양쪽에서 삭제한다', async () => {
    mockSecureStore.deleteItemAsync.mockResolvedValue();

    await removeData('accessToken');

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken', IOS_TOKEN_OPTIONS);
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');
    expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('refreshToken은 새 서비스와 기본 서비스 양쪽에서 삭제한다', async () => {
    mockSecureStore.deleteItemAsync.mockResolvedValue();

    await removeData('refreshToken');

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken', IOS_TOKEN_OPTIONS);
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
    expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('저장소가 실패하면 토스트 없이 에러를 전파한다(#737)', async () => {
    const storageError = new Error('Storage delete failed');
    mockAsyncStorage.removeItem.mockRejectedValue(storageError);

    await expect(removeData('failKey')).rejects.toThrow('Storage delete failed');
    expect(mockToast.show).not.toHaveBeenCalled();
  });
});

describe('Android', () => {
  type Helpers = {
    getData: typeof getData;
    setData: typeof setData;
    removeData: typeof removeData;
    secureStore: jest.Mocked<typeof SecureStore>;
  };

  const loadOnAndroid = (): Helpers => {
    let helpers: Helpers | undefined;
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
      helpers = {
        getData: require('../getData').getData,
        setData: require('../setData').setData,
        removeData: require('../removeData').removeData,
        secureStore: require('expo-secure-store'),
      };
    });
    jest.dontMock('react-native');
    return helpers!;
  };

  it('Keystore는 기기 잠금과 무관하므로 기존 기본 서비스를 그대로 쓴다', async () => {
    const { getData: get, setData: set, removeData: remove, secureStore } = loadOnAndroid();
    secureStore.getItemAsync.mockResolvedValue(null);

    await set('accessToken', 'abc');
    await get('accessToken');
    await remove('accessToken');

    expect(secureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'abc', undefined);
    expect(secureStore.getItemAsync).toHaveBeenCalledTimes(1);
    expect(secureStore.getItemAsync).toHaveBeenCalledWith('accessToken');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');
  });
});
