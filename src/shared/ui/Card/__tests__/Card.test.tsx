import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Card } from '../index';

describe('Card', () => {
  it('children을 렌더링한다', () => {
    const { getByText } = render(
      <Card>
        <Text>카드 내용</Text>
      </Card>
    );
    expect(getByText('카드 내용')).toBeTruthy();
  });

  it('displayName이 Card이다', () => {
    expect(Card.displayName).toBe('Card');
  });

  it('스냅샷 - default variant (기본값)', () => {
    const { toJSON } = render(
      <Card>
        <Text>내용</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - primary variant', () => {
    const { toJSON } = render(
      <Card variant="primary">
        <Text>내용</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - padding none', () => {
    const { toJSON } = render(
      <Card padding="none">
        <Text>내용</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - padding sm', () => {
    const { toJSON } = render(
      <Card padding="sm">
        <Text>내용</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - padding lg', () => {
    const { toJSON } = render(
      <Card padding="lg">
        <Text>내용</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - custom className', () => {
    const { toJSON } = render(
      <Card className="mt-4">
        <Text>내용</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
