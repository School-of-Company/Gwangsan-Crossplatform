import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Keyboard, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSheetPortalStore } from '~/shared/store/useBottomSheetPortalStore';
import { Button, Input } from '~/shared/ui';

interface CustomInputCardProps {
  isVisible: boolean;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  // 카드 오픈 애니메이션이 끝난 뒤 호출해야 한다. 애니메이션 도중 포커스를 주면
  // 안드로이드에서 한글 입력 조합 중 자소가 분리되는 문제가 있다.
  onOpenAnimationComplete?: () => void;
}

interface CardBodyProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  onLayout: () => void;
  marginBottom: number;
  translateY: Animated.Value;
  opacity: Animated.Value;
}

// 입력창의 텍스트를 이 컴포넌트 안에서 로컬 상태로 들고 있어야 한다. 부모(SpecialtiesDropdown)
// 쪽 상태로 올려서 관리하면, 타이핑할 때마다 CustomInputCard가 포털 스토어에 새로
// 등록되면서 한 프레임 지연이 생기고, 그 지연 때문에 안드로이드에서 한글 입력 조합
// 중인 TextInput이 리렌더되어 자소가 분리되어 보이는 문제가 있었다. 제출 시점의
// 최종 텍스트만 onSubmit으로 부모에 전달한다.
function CardBody({
  placeholder,
  onSubmit,
  onClose,
  inputRef,
  onLayout,
  marginBottom,
  translateY,
  opacity,
}: CardBodyProps) {
  const [value, setValue] = useState('');
  const handleSubmit = useCallback(() => onSubmit(value), [onSubmit, value]);

  return (
    <Pressable className="flex-1" onPress={onClose}>
      <Animated.View style={{ opacity }} className="flex-1 justify-end bg-black/40 px-4">
        <Pressable className="w-full" style={{ marginBottom }} onPress={(e) => e.stopPropagation()}>
          <Animated.View
            onLayout={onLayout}
            style={{ transform: [{ translateY }] }}
            className="w-full gap-6 rounded-2xl bg-white p-6">
            <Input
              ref={inputRef}
              label=""
              placeholder={placeholder}
              value={value}
              onChangeText={setValue}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
            />
            <Button onPress={handleSubmit} disabled={value.trim() === ''}>
              추가하기
            </Button>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

// 바텀시트 프레젠테이션과 동일한 iOS 스타일 슬라이드업 곡선
const CARD_SHEET_EASING = Easing.bezier(0.32, 0.72, 0, 1);
const CARD_TRANSITION_DURATION = 300;
// 카드가 화면 아래로 완전히 숨겨지도록 하는 오프셋 — 실제 카드 높이보다 충분히 크다
const CARD_HIDDEN_OFFSET = 240;
// 키보드가 올라왔을 때 카드 바닥이 키보드 상단에 완전히 붙어버리지 않도록 살짝 띄운다.
const KEYBOARD_GAP = 12;

export function CustomInputCard({
  isVisible,
  placeholder,
  onSubmit,
  onClose,
  inputRef,
  onOpenAnimationComplete,
}: CustomInputCardProps) {
  const id = useId();
  const setSheet = useBottomSheetPortalStore((s) => s.setSheet);
  const removeSheet = useBottomSheetPortalStore((s) => s.removeSheet);
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(isVisible);
  const translateY = useRef(new Animated.Value(CARD_HIDDEN_OFFSET)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  // 카드가 열릴 때마다 onLayout으로 열림 애니메이션이 딱 한 번만 실행되도록 막는 가드.
  const hasAnimatedOpenRef = useRef(false);
  // 한글 입력 중에는 안드로이드 Gboard의 예측 변환/후보 문구 바가 나타났다 사라졌다
  // 하면서 키보드 높이가 조금씩 바뀔 때마다 keyboardDidShow가 다시 발생한다(실제
  // 숨김/노출이 아니다). 그때마다 카드를 다시 움직이면 입력 중인 TextInput의 위치가
  // 바뀌면서 한글 자소가 분리되어 보이는 문제가 생긴다. 키보드가 이미 떠 있는 동안에는
  // 이후에 오는 keyboardDidShow를 전부 무시해, 실제 노출(hidden → shown) 전환에만
  // 한 번 반응하도록 한다.
  const isKeyboardShownRef = useRef(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      if (isKeyboardShownRef.current) return;
      isKeyboardShownRef.current = true;

      Animated.timing(translateY, {
        toValue: -(e.endCoordinates.height + KEYBOARD_GAP),
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      isKeyboardShownRef.current = false;

      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [translateY]);

  useEffect(() => {
    if (isVisible) {
      translateY.setValue(CARD_HIDDEN_OFFSET);
      opacity.setValue(0);
      hasAnimatedOpenRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    } else if (show) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: CARD_HIDDEN_OFFSET,
          duration: CARD_TRANSITION_DURATION,
          easing: CARD_SHEET_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: CARD_TRANSITION_DURATION,
          easing: CARD_SHEET_EASING,
          useNativeDriver: true,
        }),
      ]).start(() => setShow(false));
    }
  }, [isVisible, translateY, opacity, show]);

  // 카드의 첫 layout이 실제로 커밋된 직후(onLayout)에만 열림 애니메이션을 시작해
  // 첫 프레임이 끊기지 않게 하고, rAF로 한 프레임 더 미뤄 안전 여유를 둔다.
  const handleCardLayout = useCallback(() => {
    if (hasAnimatedOpenRef.current) return;
    hasAnimatedOpenRef.current = true;

    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: CARD_TRANSITION_DURATION,
          easing: CARD_SHEET_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: CARD_TRANSITION_DURATION,
          easing: CARD_SHEET_EASING,
          useNativeDriver: true,
        }),
      ]).start(() => onOpenAnimationComplete?.());
    });
  }, [translateY, opacity, onOpenAnimationComplete]);

  useEffect(() => {
    if (!show) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => subscription.remove();
  }, [show, onClose]);

  const marginBottom = Math.max(insets.bottom, 24);

  useEffect(() => {
    if (!show) {
      removeSheet(id);
      return undefined;
    }

    setSheet(
      id,
      <CardBody
        placeholder={placeholder}
        onSubmit={onSubmit}
        onClose={onClose}
        inputRef={inputRef}
        onLayout={handleCardLayout}
        marginBottom={marginBottom}
        translateY={translateY}
        opacity={opacity}
      />
    );

    return () => removeSheet(id);
  }, [
    show,
    id,
    setSheet,
    removeSheet,
    opacity,
    onClose,
    handleCardLayout,
    translateY,
    marginBottom,
    inputRef,
    placeholder,
    onSubmit,
  ]);

  return null;
}
