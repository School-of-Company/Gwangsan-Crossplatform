import { render } from '@testing-library/react-native';
import Light from '../index';

describe('Light', () => {
  it('밝기 제목을 렌더링한다', () => {
    const { getByText } = render(<Light lightLevel={50} />);

    expect(getByText('밝기')).toBeTruthy();
  });

  it('lightLevel에 따른 단계를 계산해 표시한다 (50 -> 5단계)', () => {
    const { getByText } = render(<Light lightLevel={50} />);

    expect(getByText('5단계')).toBeTruthy();
  });

  it('lightLevel이 1이면 1단계를 표시한다 (ceil 적용)', () => {
    const { getByText } = render(<Light lightLevel={1} />);

    expect(getByText('1단계')).toBeTruthy();
  });

  it('lightLevel이 100이면 10단계를 표시한다', () => {
    const { getByText } = render(<Light lightLevel={100} />);

    expect(getByText('10단계')).toBeTruthy();
  });

  it('lightLevel prop이 없으면 기본값 1을 사용한다', () => {
    const { getByText } = render(<Light />);

    expect(getByText('1단계')).toBeTruthy();
  });

  it('lightLevel이 음수여도 렌더링 중 오류가 발생하지 않는다', () => {
    const { getByText } = render(<Light lightLevel={-10} />);

    expect(getByText('밝기')).toBeTruthy();
  });

  it('lightLevel이 100을 초과해도 렌더링 중 오류가 발생하지 않는다', () => {
    const { getByText } = render(<Light lightLevel={150} />);

    expect(getByText('밝기')).toBeTruthy();
  });

  it('채움 막대에 색을 칠하고 lightLevel만큼 너비를 채운다', () => {
    const { getByTestId } = render(<Light lightLevel={50} />);
    const fill = getByTestId('light-fill');

    expect(fill.props.className).toContain('bg-main-500');
    expect(fill.props.style).toEqual(expect.objectContaining({ width: '50%' }));
  });
});
