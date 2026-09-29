import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '~/shared/lib/theme';
import type { MessageAnchor } from '../../model/useMessageActions';

// 하단 메뉴 한 줄 높이와 카드 사이 간격. 말풍선이 메뉴에 가려지는지 계산할 때 쓴다
const ROW_HEIGHT = 56;
const SHEET_GAP = 8;
const SHEET_BOTTOM_MARGIN = 12;
const BUBBLE_SHEET_SPACING = 16;
const FOCUS_SCALE = 1.04;
const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

interface MessageActionOverlayProps {
  readonly visible: boolean;
  readonly anchor: MessageAnchor | null;
  readonly canEdit: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
  // 강조해서 보여줄 말풍선. 메시지 목록과 같은 컴포넌트를 그대로 그린다
  readonly children: ReactNode;
}

// 말풍선이 하단 메뉴에 가려지면 메뉴 바로 위로 올린다. 화면 위쪽을 넘어가면 안전 영역에 맞춘다
export const getFocusedBubbleTop = (
  anchor: MessageAnchor,
  screenHeight: number,
  sheetHeight: number,
  topInset: number
): number => {
  const maxBottom = screenHeight - sheetHeight - BUBBLE_SHEET_SPACING;
  if (anchor.y + anchor.height <= maxBottom) return Math.max(anchor.y, topInset);
  return Math.max(maxBottom - anchor.height, topInset);
};

export const getSheetHeight = (rowCount: number, bottomInset: number) =>
  ROW_HEIGHT * rowCount + SHEET_GAP + ROW_HEIGHT + SHEET_BOTTOM_MARGIN + bottomInset;

// 내 메시지를 꾹 눌렀을 때 뜨는 화면. 뒤를 강하게 블러 처리하고 누른 말풍선만 원래 자리에서
// 살짝 키워 강조하며, 하단에 수정·삭제·취소 메뉴를 띄운다(#723)
export function MessageActionOverlay({
  visible,
  anchor,
  canEdit,
  onEdit,
  onDelete,
  onClose,
  children,
}: MessageActionOverlayProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    }).start();
  }, [visible, progress]);

  if (!visible || !anchor) return null;

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const rowCount = canEdit ? 2 : 1;
  const sheetHeight = getSheetHeight(rowCount, insets.bottom);
  const bubbleTop = getFocusedBubbleTop(anchor, screenHeight, sheetHeight, insets.top + 8);

  const backdropOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const bubbleScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, FOCUS_SCALE] });
  const bubbleShift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [anchor.y - bubbleTop, 0],
  });
  const sheetTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
    easing: Easing.out(Easing.cubic),
  });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[FILL, { opacity: backdropOpacity }]}>
        <BlurView
          intensity={80}
          tint="dark"
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={FILL}
        />
        <Pressable
          testID="message-action-backdrop"
          accessibilityLabel="메뉴 닫기"
          onPress={onClose}
          style={FILL}
        />
      </Animated.View>

      <Animated.View
        testID="message-action-focused"
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: bubbleTop,
          left: 0,
          // 말풍선 오른쪽 끝을 원래 자리와 맞춘다(내 메시지는 오른쪽 정렬)
          right: Math.max(screenWidth - (anchor.x + anchor.width), 0),
          transform: [{ translateY: bubbleShift }, { scale: bubbleScale }],
        }}>
        {children}
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: SHEET_BOTTOM_MARGIN + insets.bottom,
          transform: [{ translateY: sheetTranslate }],
        }}>
        <View className="overflow-hidden rounded-2xl bg-surface">
          {canEdit && (
            <TouchableOpacity
              testID="message-action-edit"
              onPress={onEdit}
              activeOpacity={0.6}
              style={{ height: ROW_HEIGHT }}
              className="flex-row items-center justify-between border-b border-gray-100 px-5">
              <Text className="text-body2 text-gray-900">수정</Text>
              <Icon name="create-outline" size={22} color={colors['gray-900']} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="message-action-delete"
            onPress={onDelete}
            activeOpacity={0.6}
            style={{ height: ROW_HEIGHT }}
            className="flex-row items-center justify-between px-5">
            <Text className="text-body2 text-error-500">삭제</Text>
            <Icon name="trash-outline" size={22} color="#DF454A" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          testID="message-action-cancel"
          onPress={onClose}
          activeOpacity={0.6}
          style={{ height: ROW_HEIGHT, marginTop: SHEET_GAP }}
          className="items-center justify-center rounded-2xl bg-surface">
          <Text className="text-body1 text-gray-900">취소</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
