import { render } from '@testing-library/react-native';
import { Spinner } from '../index';
import { LoadingView } from '../../LoadingView';
import { brandColors } from '~/shared/lib/theme';

describe('Spinner / LoadingView', () => {
  it('Spinner는 브랜드 색을 쓴다', () => {
    const { UNSAFE_getByType } = render(<Spinner size="large" />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator).props.color).toBe(brandColors.main);
  });

  it('LoadingView는 testID를 가진 가운데 정렬 영역에 Spinner를 그린다', () => {
    const { getByTestId } = render(<LoadingView testID="loading" />);
    expect(getByTestId('loading')).toBeTruthy();
  });
});
