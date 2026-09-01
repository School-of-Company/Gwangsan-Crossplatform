import { render } from '@testing-library/react-native';
import GwangsanBanner from '../index';

describe('GwangsanBanner', () => {
  it('gwangsan 값을 표시한다', () => {
    const { getByText } = render(<GwangsanBanner gwangsan={120} />);

    expect(getByText('120')).toBeTruthy();
  });

  it('gwangsan이 0이면 0으로 표시한다', () => {
    const { getByText } = render(<GwangsanBanner gwangsan={0} />);

    expect(getByText('0')).toBeTruthy();
  });

  it('gwangsan이 없으면 0으로 표시한다', () => {
    const { getByText } = render(<GwangsanBanner />);

    expect(getByText('0')).toBeTruthy();
  });

  it('제목 텍스트를 렌더링한다', () => {
    const { getByText } = render(<GwangsanBanner gwangsan={5} />);

    expect(getByText('광산')).toBeTruthy();
  });
});
