import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
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
import type { MessageAnchor } from '../../model/useMessageActions';

// 메뉴 크기. 말풍선과 메뉴가 화면 안에 들어가는지 계산할 때 쓴다
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 36;
const MENU_PADDING = 8;
const MENU_WIDTH = 240;
const MENU_GAP = 10;
const SCREEN_MARGIN = 12;
const FOCUS_SCALE = 1.03;
const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;
// 배경이 항상 어두운 블러라 메뉴도 테마와 상관없이 어두운 카드로 그린다
const MENU_BACKGROUND = 'rgba(28, 28, 30, 0.92)';
const MENU_BORDER = 'rgba(255, 255, 255, 0.08)';
const DELETE_COLOR = '#F16B6F';
const MENU_SUBTLE_TEXT = 'rgba(255, 255, 255, 0.5)';

interface MessageActionOverlayProps {
  readonly visible: boolean;
  readonly anchor: MessageAnchor | null;
  readonly canEdit: boolean;
  // 메뉴 맨 위에 보여줄 보낸 시각(예: 어제 오후 10:18)
  readonly timeLabel?: string;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
  // 강조해서 보여줄 말풍선. 메시지 목록과 같은 컴포넌트를 그대로 그린다
  readonly children: ReactNode;
}

export const getMenuHeight = (rowCount: number, hasHeader: boolean) =>
  MENU_PADDING * 2 + (hasHeader ? HEADER_HEIGHT : 0) + ROW_HEIGHT * rowCount;

interface MenuLayoutInput {
  readonly anchor: MessageAnchor;
  readonly screenHeight: number;
  readonly menuHeight: number;
  readonly topInset: number;
  readonly bottomInset: number;
}

// 메뉴는 말풍선 바로 아래에 붙인다. 아래 공간이 모자라면 말풍선과 메뉴를 함께 위로 올리고,
// 말풍선이 너무 길어 둘 다 들어가지 않으면 메뉴를 화면 아래쪽에 맞춰 말풍선 위에 겹친다
export const getMenuLayout = ({
  anchor,
  screenHeight,
  menuHeight,
  topInset,
  bottomInset,
}: MenuLayoutInput) => {
  const maxBottom = screenHeight - bottomInset - SCREEN_MARGIN;
  const needed = anchor.height + MENU_GAP + menuHeight;
  const bubbleTop =
    anchor.y + needed <= maxBottom
      ? Math.max(anchor.y, topInset)
      : Math.max(maxBottom - needed, topInset);
  const menuTop = Math.min(bubbleTop + anchor.height + MENU_GAP, maxBottom - menuHeight);
  return { bubbleTop, menuTop };
};

interface MenuRowProps {
  readonly testID: string;
  readonly label: string;
  readonly icon: keyof typeof Icon.glyphMap;
  readonly color: string;
  readonly onPress: () => void;
}

function MenuRow({ testID, label, icon, color, onPress }: MenuRowProps) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.6}
      style={{ height: ROW_HEIGHT }}
      className="flex-row items-center gap-4 px-5">
      <Icon name={icon} size={22} color={color} />
      <Text className="text-body2" style={{ color }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// 내 메시지를 꾹 눌렀을 때 뜨는 화면. 뒤를 강하게 블러 처리하고 누른 말풍선만 강조하며,
// 말풍선 바로 아래에 수정·삭제·취소 메뉴를 띄운다(#723)
export function MessageActionOverlay({
  visible,
  anchor,
  canEdit,
  timeLabel,
  onEdit,
  onDelete,
  onClose,
  children,
}: MessageActionOverlayProps) {
  const insets = useSafeAreaInsets();
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
  // 수정(텍스트만)·삭제·취소
  const rowCount = (canEdit ? 1 : 0) + 2;
  const menuHeight = getMenuHeight(rowCount, !!timeLabel);
  const { bubbleTop, menuTop } = getMenuLayout({
    anchor,
    screenHeight,
    menuHeight,
    topInset: insets.top + 8,
    bottomInset: insets.bottom,
  });
  // 말풍선과 메뉴의 오른쪽 끝을 원래 자리와 맞춘다(내 메시지는 오른쪽 정렬)
  const bubbleRight = Math.max(screenWidth - (anchor.x + anchor.width), 0);
  const menuRight = Math.max(bubbleRight, SCREEN_MARGIN);

  const backdropOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const bubbleScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, FOCUS_SCALE] });
  const bubbleShift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [anchor.y - bubbleTop, 0],
  });
  const menuScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

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
          right: bubbleRight,
          transform: [{ translateY: bubbleShift }, { scale: bubbleScale }],
        }}>
        {children}
      </Animated.View>

      <Animated.View
        testID="message-action-menu"
        style={{
          position: 'absolute',
          top: menuTop,
          right: menuRight,
          width: MENU_WIDTH,
          opacity: progress,
          // 말풍선 쪽(오른쪽 위)에서 펼쳐지듯 커진다
          transformOrigin: 'top right',
          transform: [{ scale: menuScale }],
        }}>
        <View
          className="overflow-hidden rounded-3xl border"
          style={{
            backgroundColor: MENU_BACKGROUND,
            borderColor: MENU_BORDER,
            paddingVertical: MENU_PADDING,
          }}>
          {timeLabel ? (
            <View style={{ height: HEADER_HEIGHT }} className="justify-center px-5">
              <Text
                testID="message-action-time"
                numberOfLines={1}
                className="text-label"
                style={{ color: MENU_SUBTLE_TEXT }}>
                {timeLabel}
              </Text>
            </View>
          ) : null}
          {canEdit && (
            <MenuRow
              testID="message-action-edit"
              label="수정"
              icon="create-outline"
              color="#FFFFFF"
              onPress={onEdit}
            />
          )}
          <MenuRow
            testID="message-action-delete"
            label="삭제"
            icon="trash-outline"
            color={DELETE_COLOR}
            onPress={onDelete}
          />
          <MenuRow
            testID="message-action-cancel"
            label="취소"
            icon="close-outline"
            color="#FFFFFF"
            onPress={onClose}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}
