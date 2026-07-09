import { render } from '@testing-library/react-native';
import { Path, Svg } from 'react-native-svg';
import BackArrow from '../BackArrow';

describe('BackArrow', () => {
  it('기본 props로 렌더링된다', () => {
    const { UNSAFE_getByType } = render(<BackArrow />);
    const svg = UNSAFE_getByType(Svg);
    expect(svg.props.width).toBe(24);
    expect(svg.props.height).toBe(24);

    const path = UNSAFE_getByType(Path);
    expect(path.props.stroke).toBe('#8F9094');
  });

  it('커스텀 color, width, height props가 적용된다', () => {
    const { UNSAFE_getByType } = render(<BackArrow color="#123456" width={32} height={48} />);
    const svg = UNSAFE_getByType(Svg);
    expect(svg.props.width).toBe(32);
    expect(svg.props.height).toBe(48);

    const path = UNSAFE_getByType(Path);
    expect(path.props.stroke).toBe('#123456');
  });

  it('스냅샷 - 기본값', () => {
    const { toJSON } = render(<BackArrow />);
    expect(toJSON()).toMatchSnapshot();
  });
});
