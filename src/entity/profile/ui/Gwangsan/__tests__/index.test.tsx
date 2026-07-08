import { render } from '@testing-library/react-native';
import Gwangsan from '../index';

describe('Gwangsan', () => {
  it('gwangsan 값을 표시한다', () => {
    const { getByText } = render(<Gwangsan gwangsan={120} />);

    expect(getByText('120 광산')).toBeTruthy();
  });

  it('gwangsan이 0이어도 정상적으로 표시한다', () => {
    const { getByText } = render(<Gwangsan gwangsan={0} />);

    expect(getByText('0 광산')).toBeTruthy();
  });

  it('gwangsan이 없으면 undefined가 표시된다', () => {
    const { getAllByText } = render(<Gwangsan />);

    expect(getAllByText('광산').length).toBeGreaterThan(0);
  });

  it('제목 텍스트를 렌더링한다', () => {
    const { getAllByText } = render(<Gwangsan gwangsan={5} />);

    expect(getAllByText('광산').length).toBeGreaterThan(0);
  });
});
