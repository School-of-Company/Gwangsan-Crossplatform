import { render } from '@testing-library/react-native';
import { Path, Svg } from 'react-native-svg';
import { SearchIcon } from '../SearchIcon';

describe('SearchIcon', () => {
  it('기본 props로 렌더링된다', () => {
    const { UNSAFE_getByType } = render(<SearchIcon />);
    const svg = UNSAFE_getByType(Svg);
    expect(svg.props.width).toBe(24);
    expect(svg.props.height).toBe(24);

    const path = UNSAFE_getByType(Path);
    expect(path.props.fill).toBe('#B4B5B7');
  });

  it('커스텀 color, width, height props가 적용된다', () => {
    const { UNSAFE_getByType } = render(<SearchIcon color="#00ff00" width={30} height={40} />);
    const svg = UNSAFE_getByType(Svg);
    expect(svg.props.width).toBe(30);
    expect(svg.props.height).toBe(40);

    const path = UNSAFE_getByType(Path);
    expect(path.props.fill).toBe('#00ff00');
  });

  it('스냅샷 - 기본값', () => {
    const { toJSON } = render(<SearchIcon />);
    expect(toJSON()).toMatchSnapshot();
  });
});
