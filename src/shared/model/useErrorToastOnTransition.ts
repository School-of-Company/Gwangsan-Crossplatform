import { useEffect, useRef } from 'react';
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
  const latest = useRef({ text1, text2, canShow });
  latest.current = { text1, text2, canShow };

  useEffect(() => {
    if (!isError || !latest.current.canShow) return;
    Toast.show({
      type: 'error',
      text1: latest.current.text1,
      text2: latest.current.text2 || DEFAULT_TEXT2,
    });
  }, [isError]);
};
