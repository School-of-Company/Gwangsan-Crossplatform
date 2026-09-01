import Toast from 'react-native-toast-message';
import type { ToastShowParams } from 'react-native-toast-message';
import { useToastQueueStore } from './toastQueue';

const DEFAULT_VISIBILITY_TIME = 4000;

// react-native-toast-message는 토스트를 한 번에 하나만 보여줄 수 있어(라이브러리 내부에도
// "TODO: use a queue when Toast is already visible"로 남아있는 미구현 기능), 짧은 간격으로
// 여러 번 Toast.show()를 호출하면 두 번째 토스트가 애니메이션 없이 이전 내용을 덮어써버린다.
// Toast.show/hide는 라이브러리 내부(Toast.js)에서도 그냥 교체 가능한 프로퍼티이기 때문에,
// 여기서 큐 기반 구현으로 바꿔치기해도 기존 호출부의 Toast.show({...}) 코드는 그대로 둘 수 있다.
// 이 patch 모듈은 ToastStack이 마운트될 때 함께 로드되어 한 번만 적용된다.
Toast.show = (params: ToastShowParams) => {
  const {
    type = 'success',
    text1,
    text2,
    onPress,
    autoHide = true,
    visibilityTime = DEFAULT_VISIBILITY_TIME,
  } = params;

  const id = useToastQueueStore.getState().push({ type, text1, text2, onPress });

  if (autoHide) {
    setTimeout(() => useToastQueueStore.getState().remove(id), visibilityTime);
  }
};

Toast.hide = () => {
  useToastQueueStore.getState().clear();
};
