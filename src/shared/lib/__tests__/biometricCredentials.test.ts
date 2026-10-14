import * as Keychain from 'react-native-keychain';
import { getData } from '../getData';
import { setData } from '../setData';
import {
  clearCredentialsForBiometric,
  getBiometricPreference,
  getCredentialsForBiometric,
  saveCredentialsForBiometric,
  setBiometricPreference,
  syncBiometricCredentials,
} from '../biometricCredentials';

jest.mock('react-native-keychain', () => ({
  getSupportedBiometryType: jest.fn(),
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESS_CONTROL: { BIOMETRY_ANY: 'BiometryAny', BIOMETRY_CURRENT_SET: 'BiometryCurrentSet' },
  ACCESSIBLE: { WHEN_UNLOCKED: 'WhenUnlocked' },
}));
jest.mock('../getData', () => ({ getData: jest.fn() }));
jest.mock('../setData', () => ({ setData: jest.fn() }));
jest.mock('../logger', () => ({ logger: { error: jest.fn(), warn: jest.fn() } }));

const mockKeychain = Keychain as jest.Mocked<typeof Keychain>;
const mockGetData = getData as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockKeychain.getSupportedBiometryType.mockResolvedValue('FaceID' as never);
});

describe('생체 인증 로그인 설정', () => {
  it.each([
    ['true', true],
    ['false', false],
    [null, null],
  ])('저장된 값 %s → %s', async (stored, expected) => {
    mockGetData.mockResolvedValue(stored);
    await expect(getBiometricPreference()).resolves.toBe(expected);
  });

  it('설정을 읽지 못하면 아직 묻지 않은 것(null)으로 본다', async () => {
    mockGetData.mockRejectedValue(new Error('read fail'));
    await expect(getBiometricPreference()).resolves.toBeNull();
  });

  it('설정을 저장한다', async () => {
    await setBiometricPreference(true);
    expect(setData).toHaveBeenCalledWith('biometricLoginEnabled', 'true');
  });
});

describe('saveCredentialsForBiometric', () => {
  it('지문·얼굴이 새로 등록되면 무효가 되도록 BIOMETRY_CURRENT_SET으로 저장한다', async () => {
    await saveCredentialsForBiometric('access', 'refresh');

    expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
      'access',
      'refresh',
      expect.objectContaining({ accessControl: 'BiometryCurrentSet' })
    );
  });

  it('생체 인증을 지원하지 않는 기기에서는 저장하지 않는다', async () => {
    mockKeychain.getSupportedBiometryType.mockResolvedValue(null as never);

    await saveCredentialsForBiometric('access', 'refresh');

    expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it('저장에 실패해도 에러를 던지지 않는다', async () => {
    mockKeychain.setGenericPassword.mockRejectedValue(new Error('keychain'));

    await expect(saveCredentialsForBiometric('a', 'r')).resolves.toBeUndefined();
  });
});

describe('getCredentialsForBiometric', () => {
  it('생체 인증 로그인을 켜지 않았으면 인증 창을 띄우지 않고 null을 돌려준다', async () => {
    mockGetData.mockResolvedValue(null);

    await expect(getCredentialsForBiometric()).resolves.toBeNull();
    expect(mockKeychain.getGenericPassword).not.toHaveBeenCalled();
  });

  it('켜 둔 경우 저장된 토큰을 돌려준다', async () => {
    mockGetData.mockResolvedValue('true');
    mockKeychain.getGenericPassword.mockResolvedValue({
      username: 'saved-access',
      password: 'saved-refresh',
    } as never);

    await expect(getCredentialsForBiometric()).resolves.toEqual({
      accessToken: 'saved-access',
      refreshToken: 'saved-refresh',
    });
  });

  it('저장된 토큰이 없거나 인증을 취소하면 null을 돌려준다', async () => {
    mockGetData.mockResolvedValue('true');
    mockKeychain.getGenericPassword.mockResolvedValueOnce(false as never);
    await expect(getCredentialsForBiometric()).resolves.toBeNull();

    mockKeychain.getGenericPassword.mockRejectedValueOnce(new Error('User cancelled'));
    await expect(getCredentialsForBiometric()).resolves.toBeNull();
  });
});

describe('syncBiometricCredentials', () => {
  it('켜 둔 경우 재발급된 토큰으로 사본을 바꾼다', async () => {
    mockGetData.mockResolvedValue('true');

    await syncBiometricCredentials('new-access', 'new-refresh');

    expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(
      'new-access',
      'new-refresh',
      expect.anything()
    );
  });

  it('켜지 않았으면 키체인에 쓰지 않는다', async () => {
    mockGetData.mockResolvedValue('false');

    await syncBiometricCredentials('new-access', 'new-refresh');

    expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
  });
});

describe('clearCredentialsForBiometric', () => {
  it('키체인 항목을 지우고, 실패해도 에러를 던지지 않는다', async () => {
    mockKeychain.resetGenericPassword.mockRejectedValueOnce(new Error('fail'));

    await expect(clearCredentialsForBiometric()).resolves.toBeUndefined();
    expect(mockKeychain.resetGenericPassword).toHaveBeenCalled();
  });
});
