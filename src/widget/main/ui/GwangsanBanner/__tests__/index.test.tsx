import { render } from '@testing-library/react-native';
import GwangsanBanner from '../index';

describe('GwangsanBanner', () => {
  it('gwangsan 값을 표시한다', () => {
    const { getByText } = render(<GwangsanBanner gwangsan={120} />);

    expect(getByText('120')).toBeTruthy();
  });

  it('광산 아이콘에 대체 텍스트를 지정한다', () => {
    const { getByLabelText } = render(<GwangsanBanner gwangsan={120} />);

    expect(getByLabelText('광산 화폐 아이콘')).toBeTruthy();
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
