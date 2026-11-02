import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from 'expo-router';

// 작성 중인 내용이 있을 때 뒤로가기(헤더·안드로이드 하드웨어 버튼 포함)로 화면이 닫히려 하면 막고
// 확인 모달을 띄운다. iOS 스와이프 제스처는 beforeRemove로 막을 수 없어 작성 중에는 제스처를 끈다.
export const useLeaveConfirm = (shouldConfirm: boolean) => {
  const navigation = useNavigation();
  const pendingLeaveRef = useRef<(() => void) | null>(null);
  const allowLeaveRef = useRef(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !shouldConfirm });
  }, [navigation, shouldConfirm]);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (!shouldConfirm || allowLeaveRef.current) return;
      event.preventDefault();
      const { action } = event.data;
      pendingLeaveRef.current = () => navigation.dispatch(action);
      setIsConfirmVisible(true);
    });
  }, [navigation, shouldConfirm]);

  const confirmLeave = useCallback(() => {
    setIsConfirmVisible(false);
    const leave = pendingLeaveRef.current;
    pendingLeaveRef.current = null;
    if (!leave) return;
    allowLeaveRef.current = true;
    leave();
  }, []);

  const cancelLeave = useCallback(() => {
    pendingLeaveRef.current = null;
    setIsConfirmVisible(false);
  }, []);

  // 등록·수정이 끝나 의도적으로 화면을 떠날 때는 확인 없이 나가도록 한다
  const allowLeave = useCallback(() => {
    allowLeaveRef.current = true;
  }, []);

  return { isConfirmVisible, confirmLeave, cancelLeave, allowLeave };
};
