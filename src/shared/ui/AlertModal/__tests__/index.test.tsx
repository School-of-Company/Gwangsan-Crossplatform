import React from 'react';
import { TouchableOpacity } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AlertModal } from '../index';

describe('AlertModal', () => {
  it('isVisible이 false이면 아무것도 렌더링하지 않는다', () => {
    const { queryByText } = render(
      <AlertModal
        isVisible={false}
        message="정말 로그아웃 하시겠어요?"
        confirmText="확인"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(queryByText('정말 로그아웃 하시겠어요?')).toBeNull();
  });

  it('isVisible이 true이면 message와 버튼 텍스트를 렌더링한다', () => {
    const { getByText } = render(
      <AlertModal
        isVisible
        message={'정말로\n로그아웃 하시겠어요?'}
        confirmText="확인"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(getByText('정말로\n로그아웃 하시겠어요?')).toBeTruthy();
    expect(getByText('확인')).toBeTruthy();
    expect(getByText('취소')).toBeTruthy();
  });

  it('cancelText를 지정하면 해당 텍스트를 렌더링한다', () => {
    const { getByText } = render(
      <AlertModal
        isVisible
        message="메시지"
        cancelText="닫기"
        confirmText="확인"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(getByText('닫기')).toBeTruthy();
  });

  it('취소 버튼 클릭 시 onCancel을 호출한다', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="확인"
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />
    );
    fireEvent.press(getByText('취소'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('확인 버튼 클릭 시 onConfirm을 호출한다', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="확인"
        onCancel={jest.fn()}
        onConfirm={onConfirm}
      />
    );
    fireEvent.press(getByText('확인'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('isLoading이면 취소/확인 버튼을 비활성화한다', () => {
    const { UNSAFE_getAllByType } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="확인"
        isLoading
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button.props.disabled).toBe(true));
  });

  it('destructive가 true이면 확인 텍스트에 error 색상 클래스를 적용한다', () => {
    const { getByText } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="삭제"
        destructive
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    const confirmText = getByText('삭제');
    expect((confirmText.props as { className: string }).className).toContain('text-error-500');
  });

  it('destructive가 false(기본값)이면 확인 텍스트에 main 색상 클래스를 적용한다', () => {
    const { getByText } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="확인"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    const confirmText = getByText('확인');
    expect((confirmText.props as { className: string }).className).toContain('text-main-500');
  });

  it('배경(바깥)을 누르면 onCancel을 호출한다', () => {
    const onCancel = jest.fn();
    const { UNSAFE_getByProps } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="확인"
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />
    );
    fireEvent.press(UNSAFE_getByProps({ className: 'flex-1' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('알럿 카드 내부를 눌러도 onCancel을 호출하지 않는다', () => {
    const onCancel = jest.fn();
    const { UNSAFE_getByProps } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="확인"
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />
    );
    fireEvent.press(UNSAFE_getByProps({ className: 'w-full max-w-[320px]' }), {
      stopPropagation: jest.fn(),
    });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('isLoading이면 배경을 눌러도 onCancel을 호출하지 않는다', () => {
    const onCancel = jest.fn();
    const { UNSAFE_getByProps } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="확인"
        isLoading
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />
    );
    fireEvent.press(UNSAFE_getByProps({ className: 'flex-1' }));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('isVisible이 true에서 false로 바뀌면 닫힘 애니메이션 후 렌더링을 멈춘다', async () => {
    const { queryByText, rerender } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="확인"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(queryByText('메시지')).toBeTruthy();

    rerender(
      <AlertModal
        isVisible={false}
        message="메시지"
        confirmText="확인"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    await waitFor(() => expect(queryByText('메시지')).toBeNull(), { timeout: 8000 });
  }, 10000);

  it('취소 버튼을 누르면 닫힘 애니메이션 없이 즉시 렌더링을 멈춘다', () => {
    const onCancel = jest.fn();
    const { queryByText, getByText, rerender } = render(
      <AlertModal
        isVisible
        message="메시지"
        confirmText="확인"
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />
    );

    fireEvent.press(getByText('취소'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(
      <AlertModal
        isVisible={false}
        message="메시지"
        confirmText="확인"
        onCancel={onCancel}
        onConfirm={jest.fn()}
      />
    );

    expect(queryByText('메시지')).toBeNull();
  });

  it('onCancel을 생략하면 취소 버튼 없이 확인 버튼만 렌더링한다', () => {
    const { queryByText, getByText } = render(
      <AlertModal isVisible message="알림 메시지" confirmText="확인" onConfirm={jest.fn()} />
    );
    expect(queryByText('취소')).toBeNull();
    expect(getByText('확인')).toBeTruthy();
  });

  it('onCancel을 생략하면 배경을 눌러도 onConfirm을 호출한다', () => {
    const onConfirm = jest.fn();
    const { UNSAFE_getByProps } = render(
      <AlertModal isVisible message="알림 메시지" confirmText="확인" onConfirm={onConfirm} />
    );
    fireEvent.press(UNSAFE_getByProps({ className: 'flex-1' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('스냅샷 - 기본 상태', () => {
    const { toJSON } = render(
      <AlertModal
        isVisible
        message={'정말로\n로그아웃 하시겠어요?'}
        confirmText="로그아웃"
        destructive
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
