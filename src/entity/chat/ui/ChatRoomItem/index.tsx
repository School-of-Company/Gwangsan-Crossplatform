import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { memo, useEffect } from 'react';
import Animated, {
  Easing,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDate } from '@/shared/lib/formatDate';
import type { ChatRoomListItem } from '../../model/chatTypes';
import type { RoomId } from '@/shared/types/chatType';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EXIT_DURATION = 220;
const EXIT_EASING = Easing.out(Easing.cubic);
const REFLOW_DURATION = 220;

interface ChatRoomItemProps {
  room: ChatRoomListItem;
  onPress: (roomId: RoomId) => void;
  onLongPress?: (roomId: RoomId) => void;
  /** 우측 상단 점 3개 메뉴 버튼 클릭 시 호출 */
  onMenuPress?: (roomId: RoomId) => void;
  /** 채팅방 나가기 확인 후 왼쪽으로 슬라이드 아웃되는 중인지 여부 */
  isExiting?: boolean;
  /** 슬라이드 아웃 애니메이션이 끝난 뒤 호출 — 이 시점에 목록에서 실제로 제거해야 위/아래 항목이 붙는 애니메이션이 이어진다 */
  onExited?: (roomId: RoomId) => void;
}

const ChatRoomItemComponent = ({
  room,
  onPress,
  onLongPress,
  onMenuPress,
  isExiting = false,
  onExited,
}: ChatRoomItemProps) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isExiting) return;

    translateX.value = withTiming(-SCREEN_WIDTH, {
      duration: EXIT_DURATION,
      easing: EXIT_EASING,
      reduceMotion: ReduceMotion.Never,
    });
    opacity.value = withTiming(0, {
      duration: EXIT_DURATION,
      easing: EXIT_EASING,
      reduceMotion: ReduceMotion.Never,
    });

    const timer = setTimeout(() => onExited?.(room.roomId), EXIT_DURATION);
    return () => clearTimeout(timer);
  }, [isExiting, room.roomId, onExited, translateX, opacity]);

  const exitStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = () => {
    onPress(room.roomId);
  };

  const handleLongPress = () => {
    onLongPress?.(room.roomId);
  };

  const handleMenuPress = () => {
    onMenuPress?.(room.roomId);
  };

  const renderUnreadBadge = () => {
    if (!room.unreadMessageCount || room.unreadMessageCount === 0) return null;
    return (
      <View className="ml-2 min-w-[20px] items-center justify-center rounded-full bg-main-500 px-1.5 py-0.5">
        <Text className="text-xs font-semibold text-white">{room.unreadMessageCount}</Text>
      </View>
    );
  };

  const productImage = room.product?.images?.[0]?.imageUrl;

  return (
    <Animated.View
      layout={LinearTransition.duration(REFLOW_DURATION)
        .easing(EXIT_EASING)
        .reduceMotion(ReduceMotion.Never)}
      style={exitStyle}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={isExiting}
        className="flex-row items-center px-4 py-3 active:bg-gray-50"
        activeOpacity={0.7}>
        <Image
          source={
            productImage ? { uri: productImage } : require('@/shared/assets/png/defaultProfile.png')
          }
          className="mr-3 h-14 w-14 rounded-lg"
          resizeMode="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="shrink text-base font-bold text-gray-900" numberOfLines={1}>
              {room.product?.title}
            </Text>
            {room.product?.isCompleted && (
              <Text testID="trade-completed-tag" className="text-xs text-gray-500">
                거래 완료
              </Text>
            )}
          </View>
          <Text className="text-sm text-gray-700" numberOfLines={1}>
            {room.member?.nickname}
          </Text>
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {room.lastMessageType === 'IMAGE' ? '📷 사진을 보냈습니다.' : room.lastMessage}
          </Text>
        </View>
        <View className="ml-2 flex-col items-end">
          <View className="mb-1 flex-row items-center">
            <Text className="text-xs text-gray-400">{formatDate(room.lastMessageTime)}</Text>
            <TouchableOpacity
              onPress={handleMenuPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="-mr-1 p-1">
              <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {renderUnreadBadge()}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ChatRoomItem = memo(ChatRoomItemComponent);
ChatRoomItem.displayName = 'ChatRoomItem';
