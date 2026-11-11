import { useEffect } from 'react';
import Toast from 'react-native-toast-message';

const DEFAULT_TEXT2 = '잠시 후 다시 시도해주세요.';

// 렌더 중에 Toast.show를 부르면 리렌더될 때마다 반복되므로, 실패로 바뀌는 순간에만 띄운다.
// 같은 실패가 이어지는 동안 text2(에러 객체)가 바뀌어도 다시 띄우지 않는다.
// canShow는 실패로 바뀌는 순간의 값만 본다 (예: 오류 화면이 대신 보이는 경우를 제외).
export const useErrorToastOnTransition = (
  isError: boolean,
  text1: string,
  text2?: string,
  canShow = true
) => {
  useEffect(() => {
    if (!isError || !canShow) return;
    Toast.show({ type: 'error', text1, text2: text2 || DEFAULT_TEXT2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);
};
