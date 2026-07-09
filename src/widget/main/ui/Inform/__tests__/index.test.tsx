import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import Inform from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

const mockRouterPush = router.push as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('Inform', () => {
  it('head, dong, place를 렌더링한다', () => {
    const { getByText } = render(<Inform dong="송정동" place="광산구청" head="우리 동네" />);

    expect(getByText('우리 동네')).toBeTruthy();
    expect(getByText('송정동 광산구청')).toBeTruthy();
  });

  it('"물건" 카드 클릭 시 OBJECT 타입으로 이동한다', () => {
    const { getByText } = render(<Inform dong="송정동" place="광산구청" head="우리 동네" />);

    fireEvent.press(getByText('물건'));

    expect(mockRouterPush).toHaveBeenCalledWith('/post?type=OBJECT');
  });

  it('"서비스" 카드 클릭 시 SERVICE 타입으로 이동한다', () => {
    const { getByText } = render(<Inform dong="송정동" place="광산구청" head="우리 동네" />);

    fireEvent.press(getByText('서비스'));

    expect(mockRouterPush).toHaveBeenCalledWith('/post?type=SERVICE');
  });
});
