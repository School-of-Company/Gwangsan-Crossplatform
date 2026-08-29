import {
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Svg, Path } from 'react-native-svg';
import { useRef, useCallback, useEffect, useState } from 'react';
import { useFooterVisibilityStore } from '~/shared/store/useFooterVisibilityStore';

interface FooterProps extends BottomTabBarProps {
  onWritePress?: () => void;
  totalUnreadCount?: number;
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

export function Footer({
  state,
  navigation,
  insets,
  onWritePress,
  totalUnreadCount = 0,
}: FooterProps) {
  const router = useRouter();
  const isHidden = useFooterVisibilityStore((s) => s.isHidden);

  const [footerHeight, setFooterHeight] = useState(0);
  const { translateY: hideTranslateY, collapse } = useFooterHideAnimation(isHidden, footerHeight);
  const animatedHeight = footerHeight ? Animated.multiply(collapse, footerHeight) : undefined;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setFooterHeight(e.nativeEvent.layout.height);
  }, []);

  // expo-router의 js-tabs 구현은 첫 렌더에서 네비게이션 state가 아직 초기화되지
  // 않은 채로 tabBar를 그릴 때가 있어(Cannot read property 'routes' of undefined),
  // state/routes가 비어 있는 경우를 방어한다.
  const activeRouteName = state?.routes?.[state?.index]?.name as TabRouteName | undefined;

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
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M21.0688 8.20407L12.6218 1.48707C12.4451 1.34623 12.2258 1.26953 11.9998 1.26953C11.7738 1.26953 11.5545 1.34623 11.3778 1.48707L2.9298 8.20407C2.69436 8.39135 2.50419 8.62933 2.37347 8.90029C2.24275 9.17126 2.17484 9.46822 2.1748 9.76907V19.1871C2.1748 19.8236 2.42766 20.434 2.87775 20.8841C3.32784 21.3342 3.93828 21.5871 4.5748 21.5871H9.9998V16.8351C9.9998 16.5699 10.1052 16.3155 10.2927 16.128C10.4802 15.9404 10.7346 15.8351 10.9998 15.8351H12.9998C13.265 15.8351 13.5194 15.9404 13.7069 16.128C13.8944 16.3155 13.9998 16.5699 13.9998 16.8351V21.5871H19.4238C20.0603 21.5871 20.6708 21.3342 21.1209 20.8841C21.5709 20.434 21.8238 19.8236 21.8238 19.1871V9.77007C21.8238 9.46922 21.7559 9.17226 21.6251 8.90129C21.4944 8.63033 21.3043 8.39135 21.0688 8.20407Z"
                fill={activeRouteName === 'main' ? '#8FC31D' : '#D1D6DB'}
              />
            </Svg>
          </Animated.View>
          <Text
            className={`mt-1 ${activeRouteName === 'main' ? 'text-[#8FC31D]' : 'text-gray-400'}`}>
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
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M11.9999 1.5C6.1999 1.5 1.3999 5.8 1.3999 11.1C1.3999 13.4 2.3999 16.5 4.9999 18.5L4.6999 21.8C4.6999 22 4.7999 22.3 4.9999 22.4C5.0999 22.5 5.1999 22.5 5.3999 22.5C5.4999 22.5 5.5999 22.5 5.6999 22.4L9.0999 20.6C9.4999 20.6 10.7999 20.8 11.8999 20.8C17.6999 20.8 22.4999 16.5 22.4999 11.2C22.4999 5.9 17.7999 1.5 11.9999 1.5Z"
                fill={activeRouteName === 'chatting' ? '#8FC31D' : '#D1D6DB'}
              />
            </Svg>
            {totalUnreadCount > 0 && (
              <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-main-500" />
            )}
          </Animated.View>
          <Text
            className={`mt-1 ${activeRouteName === 'chatting' ? 'text-[#8FC31D]' : 'text-gray-400'}`}>
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
            <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M30.6668 16.0002C30.6668 24.1002 24.1002 30.6668 16.0002 30.6668C7.90016 30.6668 1.3335 24.1002 1.3335 16.0002C1.3335 7.90016 7.90016 1.3335 16.0002 1.3335C24.1002 1.3335 30.6668 7.90016 30.6668 16.0002Z"
                fill="#D1D6DB"
              />
              <Path
                d="M9.98926 16H21.9893M15.9893 10V22"
                stroke="#8B95A1"
                strokeWidth={2}
                strokeLinecap="round"
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
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16.5172 2.15008L6.03518 7.53708H2.92118C2.35118 7.53708 1.88818 8.00008 1.88818 8.57008V15.4301C1.88818 16.0001 2.35118 16.4631 2.92118 16.4631H6.03518L16.5172 21.8501C16.6697 21.9284 16.8397 21.9663 17.011 21.9599C17.1824 21.9536 17.3492 21.9034 17.4955 21.814C17.6418 21.7246 17.7626 21.5992 17.8465 21.4496C17.9303 21.3001 17.9743 21.1315 17.9742 20.9601V3.04008C17.9743 2.86865 17.9303 2.70008 17.8465 2.55054C17.7626 2.40101 17.6418 2.27553 17.4955 2.18617C17.3492 2.0968 17.1824 2.04655 17.011 2.04023C16.8397 2.03391 16.6697 2.07174 16.5172 2.15008ZM21.2362 9.16708H19.2802V14.8331H21.2352C21.9592 14.8331 22.5452 14.2461 22.5452 13.5221V10.4791C22.5452 9.75408 21.9602 9.16708 21.2362 9.16708Z"
                fill={activeRouteName === 'notice' ? '#8FC31D' : '#D1D6DB'}
              />
            </Svg>
          </Animated.View>
          <Text
            className={`mt-1 ${activeRouteName === 'notice' ? 'text-[#8FC31D]' : 'text-gray-400'}`}>
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
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16.8881 6.64388C16.8881 7.94224 16.3724 9.18743 15.4543 10.1055C14.5362 11.0236 13.291 11.5394 11.9926 11.5394C10.6943 11.5394 9.44909 11.0236 8.53101 10.1055C7.61292 9.18743 7.09715 7.94224 7.09715 6.64388C7.08399 5.99273 7.20087 5.3455 7.44095 4.74009C7.68104 4.13468 8.0395 3.58325 8.49535 3.11809C8.95119 2.65294 9.49526 2.28341 10.0957 2.03114C10.6961 1.77887 11.3409 1.64893 11.9921 1.64893C12.6434 1.64893 13.2882 1.77887 13.8886 2.03114C14.489 2.28341 15.0331 2.65294 15.489 3.11809C15.9448 3.58325 16.3033 4.13468 16.5433 4.74009C16.7834 5.3455 16.9003 5.99273 16.8871 6.64388M11.9921 13.0369C4.94315 13.0369 2.20215 17.5229 2.20215 19.6099C2.20215 21.6959 8.03815 22.2519 11.9921 22.2519C15.9461 22.2519 21.7831 21.6959 21.7831 19.6099C21.7831 17.5229 19.0411 13.0369 11.9931 13.0369"
                fill={activeRouteName === 'profile' ? '#8FC31D' : '#D1D6DB'}
              />
            </Svg>
          </Animated.View>
          <Text
            className={`mt-1 ${activeRouteName === 'profile' ? 'text-[#8FC31D]' : 'text-gray-400'}`}>
            프로필
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}
