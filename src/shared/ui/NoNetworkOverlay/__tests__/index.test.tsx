import React from 'react';
import { Modal } from 'react-native';
import { render } from '@testing-library/react-native';
import { NoNetworkOverlay } from '../index';

describe('NoNetworkOverlay', () => {
  it('visible이 true이면 안내 텍스트와 재시도 버튼을 렌더링한다', () => {
    const { getByText } = render(<NoNetworkOverlay visible />);
    expect(getByText('인터넷에 연결되어 있지 않아요.')).toBeTruthy();
    expect(getByText(/Wi-Fi나 셀룰러 데이터 연결 상태를/)).toBeTruthy();
    expect(getByText('재시도')).toBeTruthy();
  });

  it('visible prop이 Modal에 그대로 전달된다 (true)', () => {
    const { UNSAFE_getByType } = render(<NoNetworkOverlay visible />);
    expect(UNSAFE_getByType(Modal).props.visible).toBe(true);
  });

  it('visible prop이 Modal에 그대로 전달된다 (false)', () => {
    const { UNSAFE_getByType } = render(<NoNetworkOverlay visible={false} />);
    expect(UNSAFE_getByType(Modal).props.visible).toBe(false);
  });

  it('스냅샷 - visible true', () => {
    const { toJSON } = render(<NoNetworkOverlay visible />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - visible false', () => {
    const { toJSON } = render(<NoNetworkOverlay visible={false} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
