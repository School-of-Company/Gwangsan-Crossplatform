import { Alert } from 'react-native';
import { offerBiometricLogin } from '../offerBiometricLogin';
import {
  getBiometricPreference,
  isBiometricSupported,
  saveCredentialsForBiometric,
  setBiometricPreference,
} from '~/shared/lib/biometricCredentials';

jest.mock('~/shared/lib/biometricCredentials', () => ({
  getBiometricPreference: jest.fn(),
  isBiometricSupported: jest.fn(),
  saveCredentialsForBiometric: jest.fn(() => Promise.resolve()),
  setBiometricPreference: jest.fn(() => Promise.resolve()),
}));

const mockPreference = getBiometricPreference as jest.Mock;
const mockSupported = isBiometricSupported as jest.Mock;

// Alert에서 특정 버튼을 누른 것처럼 onPress를 호출한다
const pressAlertButton = (text: string) => {
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as {
    text: string;
    onPress: () => void;
  }[];
  buttons.find((b) => b.text === text)?.onPress();
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockSupported.mockResolvedValue(true);
});

describe('offerBiometricLogin', () => {
  it('이미 켜 둔 사용자는 묻지 않고 새 토큰으로 저장한다', async () => {
    mockPreference.mockResolvedValue(true);

    await offerBiometricLogin('access', 'refresh');

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(saveCredentialsForBiometric).toHaveBeenCalledWith('access', 'refresh');
  });

  it('끈 사용자에게는 묻지도 저장하지도 않는다', async () => {
    mockPreference.mockResolvedValue(false);

    await offerBiometricLogin('access', 'refresh');

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(saveCredentialsForBiometric).not.toHaveBeenCalled();
  });

  it('생체 인증을 지원하지 않는 기기에서는 묻지 않는다', async () => {
    mockPreference.mockResolvedValue(null);
    mockSupported.mockResolvedValue(false);

    await offerBiometricLogin('access', 'refresh');

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('아직 묻지 않은 사용자에게 묻고, 사용을 고르면 저장한다', async () => {
    mockPreference.mockResolvedValue(null);

    await offerBiometricLogin('access', 'refresh');
    expect(saveCredentialsForBiometric).not.toHaveBeenCalled();

    pressAlertButton('사용');
    await new Promise(process.nextTick);

    expect(setBiometricPreference).toHaveBeenCalledWith(true);
    expect(saveCredentialsForBiometric).toHaveBeenCalledWith('access', 'refresh');
  });

  it('사용 안 함을 고르면 저장하지 않고 설정만 남긴다', async () => {
    mockPreference.mockResolvedValue(null);

    await offerBiometricLogin('access', 'refresh');
    pressAlertButton('사용 안 함');
    await new Promise(process.nextTick);

    expect(setBiometricPreference).toHaveBeenCalledWith(false);
    expect(saveCredentialsForBiometric).not.toHaveBeenCalled();
  });
});
