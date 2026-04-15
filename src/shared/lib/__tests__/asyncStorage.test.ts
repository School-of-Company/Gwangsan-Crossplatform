import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { getData } from '../getData';
import { setData } from '../setData';
import { removeData } from '../removeData';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockToast = Toast as jest.Mocked<typeof Toast>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getData', () => {
  it('저장된 값을 반환한다', async () => {
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

  it('AsyncStorage가 throw하면 Toast 에러를 표시하고 에러를 전파한다', async () => {
    const storageError = new Error('Storage read failed');
    mockAsyncStorage.getItem.mockRejectedValue(storageError);

    await expect(getData('failKey')).rejects.toThrow('Storage read failed');
    expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });
});

describe('setData', () => {
  it('주어진 key-value를 AsyncStorage에 저장한다', async () => {
    mockAsyncStorage.setItem.mockResolvedValue();

    await setData('accessToken', 'abc123');

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('accessToken', 'abc123');
  });

  it('AsyncStorage가 throw하면 Toast 에러를 표시하고 에러를 전파한다', async () => {
    const storageError = new Error('Storage write failed');
    mockAsyncStorage.setItem.mockRejectedValue(storageError);

    await expect(setData('failKey', 'value')).rejects.toThrow('Storage write failed');
    expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });
});

describe('removeData', () => {
  it('주어진 key를 AsyncStorage에서 삭제한다', async () => {
    mockAsyncStorage.removeItem.mockResolvedValue();

    await removeData('accessToken');

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
  });

  it('AsyncStorage가 throw하면 Toast 에러를 표시하고 에러를 전파한다', async () => {
    const storageError = new Error('Storage delete failed');
    mockAsyncStorage.removeItem.mockRejectedValue(storageError);

    await expect(removeData('failKey')).rejects.toThrow('Storage delete failed');
    expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });
});
