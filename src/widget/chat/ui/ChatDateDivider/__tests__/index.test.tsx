import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatDateDivider } from '../index';

describe('ChatDateDivider', () => {
  it('label prop 텍스트를 렌더링한다', () => {
    const { getByText } = render(<ChatDateDivider label="2026년 8월 28일" />);
    expect(getByText('2026년 8월 28일')).toBeTruthy();
  });

  it('다른 label 값으로도 정상적으로 렌더링된다', () => {
    const { getByText } = render(<ChatDateDivider label="어제" />);
    expect(getByText('어제')).toBeTruthy();
  });
});
