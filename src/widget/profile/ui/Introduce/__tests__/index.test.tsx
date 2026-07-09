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
