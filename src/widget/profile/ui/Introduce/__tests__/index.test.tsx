import React from 'react';
import { render } from '@testing-library/react-native';
import Introduce from '../index';

describe('Introduce', () => {
  it('"소개" 제목을 렌더링한다', () => {
    const { getByText } = render(<Introduce />);

    expect(getByText('소개')).toBeTruthy();
  });

  it('introduce 텍스트를 렌더링한다', () => {
    const { getByText } = render(<Introduce introduce="안녕하세요, 반갑습니다." />);

    expect(getByText('안녕하세요, 반갑습니다.')).toBeTruthy();
  });

  it('specialty 배열을 모두 렌더링한다', () => {
    const { getByText } = render(<Introduce specialty={['목공', '요리', '수리']} />);

    expect(getByText('목공')).toBeTruthy();
    expect(getByText('요리')).toBeTruthy();
    expect(getByText('수리')).toBeTruthy();
  });

  it('specialty가 5개를 넘어도 모두 렌더링한다', () => {
    const specialty = ['목공', '요리', '수리', '청소', '운전', '텃밭'];
    const { getByText } = render(<Introduce specialty={specialty} />);

    specialty.forEach((v) => expect(getByText(v)).toBeTruthy());
  });

  it('특기 태그 컨테이너가 줄바꿈되도록 flexWrap이 적용된다', () => {
    const { getByTestId } = render(<Introduce specialty={['목공', '요리']} />);

    // NativeWind는 jest 환경에서 className을 style로 변환하지 않으므로 클래스 자체를 검증한다.
    const list = getByTestId('introduce-specialty-list');

    expect(list.props.className).toContain('flex-row');
    expect(list.props.className).toContain('flex-wrap');
  });

  it('specialty가 없으면 특기 태그를 렌더링하지 않는다', () => {
    const { queryByText } = render(<Introduce />);

    expect(queryByText('목공')).toBeNull();
  });

  it('specialty가 빈 배열이면 특기 태그를 렌더링하지 않는다', () => {
    const { queryByText } = render(<Introduce specialty={[]} />);

    expect(queryByText('목공')).toBeNull();
  });

  it('introduce가 없으면 빈 텍스트를 렌더링한다', () => {
    const { toJSON } = render(<Introduce />);

    expect(toJSON()).toBeTruthy();
  });
});
