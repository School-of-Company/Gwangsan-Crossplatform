import { ActivityIndicator } from 'react-native';
import { render, renderHook } from '@testing-library/react-native';
import { Spinner } from '../index';
import { LoadingView } from '../../LoadingView';
import { useThemeColors } from '~/shared/lib/theme';

describe('Spinner / LoadingView', () => {
  it('Spinner는 브랜드 색을 쓴다', () => {
    const { result } = renderHook(() => useThemeColors());
    const { UNSAFE_getByType } = render(<Spinner size="large" />);
    expect(UNSAFE_getByType(ActivityIndicator).props.color).toBe(result.current.main);
  });

  it('LoadingView는 testID를 가진 가운데 정렬 영역에 Spinner를 그린다', () => {
    const { getByTestId } = render(<LoadingView testID="loading" />);
    expect(getByTestId('loading')).toBeTruthy();
  });
});
