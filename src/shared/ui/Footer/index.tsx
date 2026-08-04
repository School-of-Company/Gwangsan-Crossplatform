import {
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Svg, Path } from 'react-native-svg';
import { useRef, useCallback, useEffect, useState } from 'react';
import { useChatRooms } from '~/entity/chat/model/useChatRooms';
import { useFooterVisibilityStore } from '~/shared/store/useFooterVisibilityStore';

interface FooterProps extends BottomTabBarProps {
  onWritePress?: () => void;
}

const TAB_ROUTE_NAMES = ['main', 'chatting', 'notice', 'profile'] as const;
type TabRouteName = (typeof TAB_ROUTE_NAMES)[number];

const SHOW_DURATION = 150; // 모달이 닫히고 푸터가 다시 올라오는 시간 — 빠르고 즉각적으로
const FALLBACK_HIDE_OFFSET = 90; // 레이아웃 측정 전에 숨김이 트리거될 때의 대체 이동 거리

function useFooterHideAnimation(isHidden: boolean, footerHeight: number) {
  const translateY = useRef(
    new Animated.Value(isHidden ? footerHeight || FALLBACK_HIDE_OFFSET : 0)
  ).current;
  // 1 = 완전히 펼쳐짐, 0 = 완전히 접힘. 탭바가 사라지는 동안 차지하던
  // 레이아웃 공간도 함께 접혀야 모달 아래에 빈 공간이 남지 않는다.
  const collapse = useRef(new Animated.Value(isHidden ? 0 : 1)).current;
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    // 레이아웃 공간(collapse)은 JS 스레드 애니메이션이라 translateY(네이티브 드라이버)와
    // 속도가 어긋나 끈적이는 느낌을 준다 — 애니메이션 없이 즉시 접었다 펼친다
    collapse.setValue(isHidden ? 0 : 1);

    if (isHidden) {
      // 모달이 뜰 때는 애니메이션 없이 즉시 자리에서 사라진다
      translateY.setValue(footerHeight || FALLBACK_HIDE_OFFSET);
      return;
    }

    // 모달이 닫힐 때는 콘텐츠만 빠르게 원래 자리로 슬라이드된다
    Animated.timing(translateY, {
      toValue: 0,
      duration: SHOW_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isHidden, footerHeight, translateY, collapse]);

  return { translateY, collapse };
}

function useIconPressScale() {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (_e: GestureResponderEvent) => {
      Animated.timing(scale, { toValue: 0.85, duration: 100, useNativeDriver: true }).start();
    },
    [scale]
  );

  const handlePressOut = useCallback(
    (_e: GestureResponderEvent) => {
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
    },
    [scale]
  );

  return { scale, handlePressIn, handlePressOut };
}

export function Footer({ state, navigation, insets, onWritePress }: FooterProps) {
  const router = useRouter();
  const { totalUnreadCount } = useChatRooms();
  const isHidden = useFooterVisibilityStore((s) => s.isHidden);

  const [footerHeight, setFooterHeight] = useState(0);
  const { translateY: hideTranslateY, collapse } = useFooterHideAnimation(isHidden, footerHeight);
  const animatedHeight = footerHeight ? Animated.multiply(collapse, footerHeight) : undefined;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setFooterHeight(e.nativeEvent.layout.height);
  }, []);

  const activeRouteName = state.routes[state.index].name as TabRouteName;

  const homeScale = useIconPressScale();
  const chattingScale = useIconPressScale();
  const writeScale = useIconPressScale();
  const noticeScale = useIconPressScale();
  const profileScale = useIconPressScale();

  const navigateToTab = (routeName: TabRouteName) => {
    if (activeRouteName === routeName) return;
    navigation.navigate(routeName);
  };

  return (
    <Animated.View
      className="w-full overflow-hidden bg-white"
      style={{ height: animatedHeight }}
      pointerEvents={isHidden ? 'none' : 'auto'}>
      <Animated.View
        className="relative bottom-0 flex-row border-t border-gray-200 bg-white px-2 pt-1"
        onLayout={handleLayout}
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
          transform: [{ translateY: hideTranslateY }],
        }}>
        <TouchableOpacity
          className="flex-1 items-center justify-center py-2"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={1}
          onPressIn={homeScale.handlePressIn}
          onPressOut={homeScale.handlePressOut}
          onPress={() => navigateToTab('main')}>
          <Animated.View style={{ transform: [{ scale: homeScale.scale }] }}>
            <Ionicons
              name="home-outline"
              size={24}
              color={activeRouteName === 'main' ? '#8FC31D' : '#8F9094'}
            />
          </Animated.View>
          <Text className={activeRouteName === 'main' ? 'text-[#8FC31D]' : 'text-gray-500'}>
            홈
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 items-center justify-center py-2"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={1}
          onPressIn={chattingScale.handlePressIn}
          onPressOut={chattingScale.handlePressOut}
          onPress={() => navigateToTab('chatting')}>
          <Animated.View
            className="relative"
            style={{ transform: [{ scale: chattingScale.scale }] }}>
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={activeRouteName === 'chatting' ? '#8FC31D' : '#8F9094'}
            />
            {totalUnreadCount > 0 && (
              <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-main-500" />
            )}
          </Animated.View>
          <Text className={activeRouteName === 'chatting' ? 'text-[#8FC31D]' : 'text-gray-500'}>
            채팅
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 items-center justify-center py-2"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={1}
          onPressIn={writeScale.handlePressIn}
          onPressOut={writeScale.handlePressOut}
          onPress={onWritePress ?? (() => router.push('/write'))}>
          <Animated.View style={{ transform: [{ scale: writeScale.scale }] }}>
            <Svg width={33} height={32} viewBox="0 0 33 32" fill="none">
              <Path
                d="M16.5 0C7.67785 0 0.5 7.17785 0.5 16C0.5 24.8222 7.67785 32 16.5 32C25.3222 32 32.5 24.8222 32.5 16C32.5 7.17785 25.3222 0 16.5 0ZM16.5 2.46154C23.9917 2.46154 30.0385 8.50831 30.0385 16C30.0385 23.4917 23.9917 29.5385 16.5 29.5385C9.00831 29.5385 2.96154 23.4917 2.96154 16C2.96154 8.50831 9.00831 2.46154 16.5 2.46154ZM15.2692 8.61539V14.7692H9.11539V17.2308H15.2692V23.3846H17.7308V17.2308H23.8846V14.7692H17.7308V8.61539H15.2692Z"
                fill="black"
              />
            </Svg>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 items-center justify-center py-2"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={1}
          onPressIn={noticeScale.handlePressIn}
          onPressOut={noticeScale.handlePressOut}
          onPress={() => navigateToTab('notice')}>
          <Animated.View style={{ transform: [{ scale: noticeScale.scale }] }}>
            <Ionicons
              name="megaphone-outline"
              size={24}
              color={activeRouteName === 'notice' ? '#8FC31D' : '#8F9094'}
            />
          </Animated.View>
          <Text className={activeRouteName === 'notice' ? 'text-[#8FC31D]' : 'text-gray-500'}>
            공지
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="Footer-profile-button"
          className="flex-1 items-center justify-center py-2"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={1}
          onPressIn={profileScale.handlePressIn}
          onPressOut={profileScale.handlePressOut}
          onPress={() => navigateToTab('profile')}>
          <Animated.View style={{ transform: [{ scale: profileScale.scale }] }}>
            <Ionicons
              name="person-outline"
              size={24}
              color={activeRouteName === 'profile' ? '#8FC31D' : '#8F9094'}
            />
          </Animated.View>
          <Text className={activeRouteName === 'profile' ? 'text-[#8FC31D]' : 'text-gray-500'}>
            프로필
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}
