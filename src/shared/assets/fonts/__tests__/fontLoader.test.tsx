import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Font from 'expo-font';
import { useCustomFonts } from '../fontLoader';

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
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
});
