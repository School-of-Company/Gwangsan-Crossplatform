import { render } from '@testing-library/react-native';
import { Path, Svg } from 'react-native-svg';
import CheckIcon from '../CheckIcon';

describe('CheckIcon', () => {
  it('기본 props로 렌더링된다', () => {
    const { UNSAFE_getByType } = render(<CheckIcon />);
    const svg = UNSAFE_getByType(Svg);
    expect(svg.props.width).toBe(16);
    expect(svg.props.height).toBe(16);

    const path = UNSAFE_getByType(Path);
    expect(path.props.stroke).toBe('#0075C2');
  });

  it('커스텀 color, width, height props가 적용된다', () => {
    const { UNSAFE_getByType } = render(<CheckIcon color="#ff0000" width={20} height={20} />);
    const svg = UNSAFE_getByType(Svg);
    expect(svg.props.width).toBe(20);
    expect(svg.props.height).toBe(20);

    const path = UNSAFE_getByType(Path);
    expect(path.props.stroke).toBe('#ff0000');
  });

  it('스냅샷 - 기본값', () => {
    const { toJSON } = render(<CheckIcon />);
    expect(toJSON()).toMatchSnapshot();
  });
});
