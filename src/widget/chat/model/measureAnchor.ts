import type { View } from 'react-native';
import type { MessageAnchor } from './useMessageActions';

const EMPTY_ANCHOR: MessageAnchor = { x: 0, y: 0, width: 0, height: 0 };

// 말풍선의 화면상 위치를 잰다. 잴 수 없으면(마운트 전 등) 빈 위치로라도 메뉴를 열 수 있게 한다
export const measureAnchor = (node: View | null, onMeasured: (anchor: MessageAnchor) => void) => {
  if (!node?.measureInWindow) {
    onMeasured(EMPTY_ANCHOR);
    return;
  }
  node.measureInWindow((x, y, width, height) => onMeasured({ x, y, width, height }));
};
