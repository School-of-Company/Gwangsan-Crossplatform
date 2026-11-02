import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Header from '../index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('Header', () => {
  it('로고 이미지를 렌더링한다', () => {
    mockUseRouter.mockReturnValue({ push: jest.fn() });

    const { getByLabelText } = render(<Header />);

    expect(getByLabelText('시민화폐 광산')).toBeTruthy();
  });

  it('알림 아이콘을 누르면 /notification으로 이동한다', () => {
    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue({ push: mockPush });

    const { getByRole } = render(<Header />);

    fireEvent.press(getByRole('button', { name: '알림' }));

    expect(mockPush).toHaveBeenCalledWith('/notification');
  });
});
