import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Font from 'expo-font';
import { logger } from '~/shared/lib/logger';
import { useCustomFonts } from '../fontLoader';

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

const TestComponent = () => {
  const loaded = useCustomFonts();
  return <Text>{loaded ? 'loaded' : 'loading'}</Text>;
};

describe('useCustomFonts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('폰트 로드가 완료되기 전에는 false를 반환한다', () => {
    (Font.loadAsync as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { getByText } = render(<TestComponent />);

    expect(getByText('loading')).toBeTruthy();
  });

  it('폰트 로드가 완료되면 true를 반환한다', async () => {
    (Font.loadAsync as jest.Mock).mockResolvedValue(undefined);

    const { getByText } = render(<TestComponent />);

    await waitFor(() => expect(getByText('loaded')).toBeTruthy());
  });

  it('Cafe24SsurroundOTF 폰트를 로드 요청한다', async () => {
    (Font.loadAsync as jest.Mock).mockResolvedValue(undefined);

    render(<TestComponent />);

    await waitFor(() =>
      expect(Font.loadAsync).toHaveBeenCalledWith(
        expect.objectContaining({ Cafe24SsurroundOTF: expect.anything() })
      )
    );
  });

  it('폰트 로드가 실패해도 true를 반환해 앱이 진행된다', async () => {
    (Font.loadAsync as jest.Mock).mockRejectedValue(new Error('font load failed'));

    const { getByText } = render(<TestComponent />);

    await waitFor(() => expect(getByText('loaded')).toBeTruthy());
  });

  it('폰트 로드가 실패하면 logger.error로 기록한다', async () => {
    const error = new Error('font load failed');
    (Font.loadAsync as jest.Mock).mockRejectedValue(error);

    render(<TestComponent />);

    await waitFor(() => expect(logger.error).toHaveBeenCalledWith('폰트 로드 실패', error));
  });

  it('폰트 로드가 성공하면 logger.error를 호출하지 않는다', async () => {
    (Font.loadAsync as jest.Mock).mockResolvedValue(undefined);

    const { getByText } = render(<TestComponent />);

    await waitFor(() => expect(getByText('loaded')).toBeTruthy());
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('언마운트 후 로드가 실패해도 오류 없이 기록만 한다', async () => {
    let reject!: (e: Error) => void;
    (Font.loadAsync as jest.Mock).mockReturnValue(
      new Promise((_, r) => {
        reject = r;
      })
    );

    const { unmount } = render(<TestComponent />);
    unmount();
    reject(new Error('font load failed'));

    await waitFor(() => expect(logger.error).toHaveBeenCalled());
  });
});
