import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking, Modal, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { VersionUpdateModal } from '../index';
import { useAppVersion } from '~/entity/appVersion';

jest.mock('~/entity/appVersion', () => ({
  useAppVersion: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.1.4',
}));

const mockUseAppVersion = useAppVersion as jest.Mock;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const mockVersion = (latestVersion: string, minimumVersion: unknown = '1.0.0') => {
  mockUseAppVersion.mockReturnValue({ data: { latestVersion, minimumVersion } });
};

const FORCE_MESSAGE = '업데이트 후 이용할 수 있습니다';
const OPTIONAL_MESSAGE = '새로운 버전이 출시되었습니다';

const originalPlatformOS = Platform.OS;

beforeEach(() => {
  jest.clearAllMocks();
  (Application as { nativeApplicationVersion: string }).nativeApplicationVersion = '1.1.4';
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue(undefined);
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});

afterEach(() => {
  Platform.OS = originalPlatformOS;
});

describe('VersionUpdateModal', () => {
  it('현재 버전이 최신 버전보다 낮으면 모달을 보여준다', async () => {
    mockVersion('1.1.5');

    const { findByText } = render(<VersionUpdateModal />);

    expect(await findByText('새로운 버전이 출시되었습니다')).toBeTruthy();
  });

  it('현재 버전이 최신 버전과 같거나 높으면 모달을 보여주지 않는다', async () => {
    mockVersion('1.1.4');

    const { queryByText } = render(<VersionUpdateModal />);
    await waitFor(() => expect(mockUseAppVersion).toHaveBeenCalled());

    expect(queryByText('새로운 버전이 출시되었습니다')).toBeNull();
  });

  it('7일 이내에 미룬 기록이 있으면 다시 보여주지 않는다', async () => {
    mockVersion('1.1.5');
    mockAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({ dismissedAt: new Date().toISOString(), dismissedVersion: '1.1.5' })
    );

    const { queryByText } = render(<VersionUpdateModal />);
    await waitFor(() => expect(mockAsyncStorage.getItem).toHaveBeenCalled());

    expect(queryByText('새로운 버전이 출시되었습니다')).toBeNull();
  });

  it('7일이 지난 미룸 기록이면 다시 보여준다', async () => {
    mockVersion('1.1.5');
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    mockAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({ dismissedAt: eightDaysAgo, dismissedVersion: '1.1.5' })
    );

    const { findByText } = render(<VersionUpdateModal />);

    expect(await findByText('새로운 버전이 출시되었습니다')).toBeTruthy();
  });

  it('미룬 버전보다 서버 최신 버전이 더 높으면 기간과 무관하게 즉시 다시 보여준다', async () => {
    mockVersion('1.1.6');
    mockAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({ dismissedAt: new Date().toISOString(), dismissedVersion: '1.1.5' })
    );

    const { findByText } = render(<VersionUpdateModal />);

    expect(await findByText('새로운 버전이 출시되었습니다')).toBeTruthy();
  });

  it('"나중에"를 누르면 dismissedAt/dismissedVersion을 AsyncStorage에 저장한다', async () => {
    mockVersion('1.1.5');

    const { findByText } = render(<VersionUpdateModal />);
    fireEvent.press(await findByText('나중에'));

    await waitFor(() => expect(mockAsyncStorage.setItem).toHaveBeenCalled());
    const [key, value] = mockAsyncStorage.setItem.mock.calls[0];
    expect(key).toBe('appVersionUpdateDismissed');
    expect(JSON.parse(value as string)).toMatchObject({ dismissedVersion: '1.1.5' });
  });

  it('iOS에서 "업데이트"를 누르면 App Store 스킴으로 이동한다', async () => {
    Platform.OS = 'ios';
    mockVersion('1.1.5');

    const { findByText } = render(<VersionUpdateModal />);
    fireEvent.press(await findByText('업데이트'));

    expect(Linking.openURL).toHaveBeenCalledWith('itms-apps://apps.apple.com/app/id6758655368');
  });

  it('Android에서 "업데이트"를 누르면 market:// 스킴으로 이동하고, 실패하면 웹 스토어로 대체한다', async () => {
    Platform.OS = 'android';
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('no market app'));
    mockVersion('1.1.5');

    const { findByText } = render(<VersionUpdateModal />);
    fireEvent.press(await findByText('업데이트'));

    expect(Linking.openURL).toHaveBeenCalledWith('market://details?id=gwangsan.io.kr');
    await waitFor(() =>
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://play.google.com/store/apps/details?id=gwangsan.io.kr'
      )
    );
  });

  describe('강제 업데이트 (minimumVersion)', () => {
    it('현재 버전이 minimumVersion보다 낮으면 "나중에" 없이 업데이트 버튼만 있는 모달을 보여준다', async () => {
      mockVersion('1.2.0', '1.1.5');

      const { findByText, queryByText } = render(<VersionUpdateModal />);

      expect(await findByText(FORCE_MESSAGE)).toBeTruthy();
      expect(queryByText('업데이트')).toBeTruthy();
      expect(queryByText('나중에')).toBeNull();
      expect(queryByText(OPTIONAL_MESSAGE)).toBeNull();
    });

    it('7일 이내에 미룬 기록이 있어도 강제 업데이트는 보여준다', async () => {
      mockVersion('1.2.0', '1.1.5');
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ dismissedAt: new Date().toISOString(), dismissedVersion: '1.2.0' })
      );

      const { findByText } = render(<VersionUpdateModal />);

      expect(await findByText(FORCE_MESSAGE)).toBeTruthy();
    });

    it('"업데이트"를 눌러 스토어로 이동해도 모달은 닫히지 않는다', async () => {
      Platform.OS = 'ios';
      mockVersion('1.2.0', '1.1.5');

      const { findByText, getByText } = render(<VersionUpdateModal />);
      fireEvent.press(await findByText('업데이트'));

      expect(Linking.openURL).toHaveBeenCalledWith('itms-apps://apps.apple.com/app/id6758655368');
      expect(getByText(FORCE_MESSAGE)).toBeTruthy();
    });

    it('안드로이드 뒤로가기와 배경 터치로는 닫히지 않는다', async () => {
      Platform.OS = 'android';
      mockVersion('1.2.0', '1.1.5');

      const { findByText, getByText, UNSAFE_getByType, UNSAFE_getByProps } = render(
        <VersionUpdateModal />
      );
      await findByText(FORCE_MESSAGE);

      act(() => UNSAFE_getByType(Modal).props.onRequestClose());
      fireEvent.press(UNSAFE_getByProps({ className: 'flex-1' }));

      expect(getByText(FORCE_MESSAGE)).toBeTruthy();
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('현재 버전이 minimumVersion과 같으면 선택 업데이트만 보여준다', async () => {
      mockVersion('1.2.0', '1.1.4');

      const { findByText, queryByText } = render(<VersionUpdateModal />);

      expect(await findByText(OPTIONAL_MESSAGE)).toBeTruthy();
      expect(queryByText('나중에')).toBeTruthy();
      expect(queryByText(FORCE_MESSAGE)).toBeNull();
    });

    it.each([
      ['없음', undefined],
      ['null', null],
      ['빈 문자열', ''],
      ['형식이 깨진 값', '9abc'],
    ])('minimumVersion이 %s이면 강제하지 않고 선택 업데이트로 동작한다', async (_, minimum) => {
      mockVersion('1.2.0', minimum);

      const { findByText, queryByText } = render(<VersionUpdateModal />);

      expect(await findByText(OPTIONAL_MESSAGE)).toBeTruthy();
      expect(queryByText(FORCE_MESSAGE)).toBeNull();
    });

    it('버전 조회에 실패하면(data 없음) 아무것도 띄우지 않는다', async () => {
      mockUseAppVersion.mockReturnValue({ data: undefined, isError: true });

      const { queryByText } = render(<VersionUpdateModal />);
      await waitFor(() => expect(mockUseAppVersion).toHaveBeenCalled());

      expect(queryByText(FORCE_MESSAGE)).toBeNull();
      expect(queryByText(OPTIONAL_MESSAGE)).toBeNull();
    });
  });
});
