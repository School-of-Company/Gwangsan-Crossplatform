import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import AuthButtonContainer from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const mockPush = router.push as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('AuthButtonContainer', () => {
  it('로그인, 회원가입 버튼을 렌더링한다', () => {
    const { getByText } = render(<AuthButtonContainer />);

    expect(getByText('로그인')).toBeTruthy();
    expect(getByText('회원가입')).toBeTruthy();
  });

  it('로그인 버튼을 누르면 /signin으로 이동한다', () => {
    const { getByText } = render(<AuthButtonContainer />);

    fireEvent.press(getByText('로그인'));

    expect(mockPush).toHaveBeenCalledWith('/signin');
  });

  it('회원가입 버튼을 누르면 /signup으로 이동한다', () => {
    const { getByText } = render(<AuthButtonContainer />);

    fireEvent.press(getByText('회원가입'));

    expect(mockPush).toHaveBeenCalledWith('/signup');
  });
});
