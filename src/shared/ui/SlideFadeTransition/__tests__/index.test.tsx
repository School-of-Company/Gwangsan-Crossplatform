import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { SlideFadeTransition } from '../index';

describe('SlideFadeTransition', () => {
  it('direction이 null이면 래핑 없이 children을 그대로 렌더링한다', () => {
    const { getByText, UNSAFE_queryAllByType } = render(
      <SlideFadeTransition direction={null}>
        <Text>content</Text>
      </SlideFadeTransition>
    );

    expect(getByText('content')).toBeTruthy();
    expect(UNSAFE_queryAllByType('Animated.View' as never)).toHaveLength(0);
  });

  it('direction이 right이면 애니메이션 래퍼로 children을 감싼다', () => {
    const { getByText, UNSAFE_queryAllByType } = render(
      <SlideFadeTransition direction="right">
        <Text>content</Text>
      </SlideFadeTransition>
    );

    expect(getByText('content')).toBeTruthy();
    expect(UNSAFE_queryAllByType('Animated.View' as never)).toHaveLength(2);
  });

  it('direction이 left이면 애니메이션 래퍼로 children을 감싼다', () => {
    const { getByText, UNSAFE_queryAllByType } = render(
      <SlideFadeTransition direction="left">
        <Text>content</Text>
      </SlideFadeTransition>
    );

    expect(getByText('content')).toBeTruthy();
    expect(UNSAFE_queryAllByType('Animated.View' as never)).toHaveLength(2);
  });
});
