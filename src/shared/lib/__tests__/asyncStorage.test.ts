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
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

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

  it('accessToken은 SecureStore에서 값을 반환한다', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue('secure-token');

    const result = await getData('accessToken');

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('accessToken');
    expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
    expect(result).toBe('secure-token');
  });

  it('refreshToken은 SecureStore에서 값을 반환한다', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue('secure-refresh');

    const result = await getData('refreshToken');

    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('refreshToken');
    expect(result).toBe('secure-refresh');
  });

  it('AsyncStorage가 throw하면 Toast 에러를 표시하고 에러를 전파한다', async () => {
    const storageError = new Error('Storage read failed');
    mockAsyncStorage.getItem.mockRejectedValue(storageError);

    await expect(getData('failKey')).rejects.toThrow('Storage read failed');
    expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });
});

describe('setData', () => {
  it('일반 키는 AsyncStorage에 저장한다', async () => {
    mockAsyncStorage.setItem.mockResolvedValue();

    await setData('memberId', '42');

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('memberId', '42');
    expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('accessToken은 SecureStore에 저장한다', async () => {
    mockSecureStore.setItemAsync.mockResolvedValue();

    await setData('accessToken', 'abc123');

    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'abc123');
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('refreshToken은 SecureStore에 저장한다', async () => {
    mockSecureStore.setItemAsync.mockResolvedValue();

    await setData('refreshToken', 'ref456');

    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'ref456');
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('AsyncStorage가 throw하면 Toast 에러를 표시하고 에러를 전파한다', async () => {
    const storageError = new Error('Storage write failed');
    mockAsyncStorage.setItem.mockRejectedValue(storageError);

    await expect(setData('failKey', 'value')).rejects.toThrow('Storage write failed');
    expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });
});

describe('removeData', () => {
  it('일반 키는 AsyncStorage에서 삭제한다', async () => {
    mockAsyncStorage.removeItem.mockResolvedValue();

    await removeData('memberId');

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('memberId');
    expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('accessToken은 SecureStore에서 삭제한다', async () => {
    mockSecureStore.deleteItemAsync.mockResolvedValue();

    await removeData('accessToken');

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');
    expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('refreshToken은 SecureStore에서 삭제한다', async () => {
    mockSecureStore.deleteItemAsync.mockResolvedValue();

    await removeData('refreshToken');

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
    expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('AsyncStorage가 throw하면 Toast 에러를 표시하고 에러를 전파한다', async () => {
    const storageError = new Error('Storage delete failed');
    mockAsyncStorage.removeItem.mockRejectedValue(storageError);

    await expect(removeData('failKey')).rejects.toThrow('Storage delete failed');
    expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });
});
