import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BottomSheetModalWrapper } from '~/shared/ui/BottomSheetModalWrapper';
import { Button } from '~/shared/ui/Button';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const SIDE_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_COUNT / 2);
// 손을 뗄 때 속도를 살짝 반영해 목표 인덱스를 앞으로 밀어준다 (플릭 시 관성 느낌)
const VELOCITY_PROJECTION = 0.15;
// 정착 애니메이션 — 기계적으로 딱 멈추지 않고 스프링처럼 자연스럽게 감속하며 안착시킨다
const SETTLE_SPRING_CONFIG = { damping: 26, stiffness: 260, mass: 0.6 };

const PERIOD_ITEMS = ['오전', '오후'] as const;
const HOUR_ITEMS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_STEP = 5;
const MINUTE_ITEMS = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP);

type Period = (typeof PERIOD_ITEMS)[number];

interface ParsedTime {
  period: Period;
  hour: number;
  minute: number;
}

const parseTime = (value?: string): ParsedTime => {
  if (!value) return { period: '오전', hour: 9, minute: 0 };

  const [hStr, mStr] = value.split(':');
  const hour24 = Number(hStr);
  const roundedMinute = Math.round(Number(mStr) / MINUTE_STEP) * MINUTE_STEP;
  const minute = roundedMinute >= 60 ? 0 : roundedMinute;
  const period: Period = hour24 < 12 ? '오전' : '오후';
  const hour12 = hour24 % 12;

  return { period, hour: hour12 === 0 ? 12 : hour12, minute };
};

const toTimeValue = (period: Period, hour: number, minute: number) => {
  const hour24 = period === '오후' ? (hour % 12) + 12 : hour % 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

interface WheelColumnProps<T> {
  readonly items: readonly T[];
  readonly initialIndex: number;
  readonly onChangeIndex: (index: number) => void;
  readonly renderLabel: (item: T) => string;
}

function WheelColumn<T>({ items, initialIndex, onChangeIndex, renderLabel }: WheelColumnProps<T>) {
  const maxOffset = (items.length - 1) * ITEM_HEIGHT;
  const offset = useSharedValue(initialIndex * ITEM_HEIGHT);
  const startOffset = useSharedValue(0);

  const commitIndex = useCallback(
    (index: number) => {
      onChangeIndex(index);
    },
    [onChangeIndex]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue: .value assignment is the intended API
          startOffset.value = offset.value;
        })
        .onUpdate((e) => {
          const next = startOffset.value - e.translationY;
          // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue: .value assignment is the intended API
          offset.value = Math.min(Math.max(next, 0), maxOffset);
        })
        .onEnd((e) => {
          const projected = offset.value - e.velocityY * VELOCITY_PROJECTION;
          const clamped = Math.min(Math.max(projected, 0), maxOffset);
          const targetIndex = Math.round(clamped / ITEM_HEIGHT);
          // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue: .value assignment is the intended API
          offset.value = withSpring(targetIndex * ITEM_HEIGHT, SETTLE_SPRING_CONFIG);
          runOnJS(commitIndex)(targetIndex);
        }),
    [maxOffset, offset, startOffset, commitIndex]
  );

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ height: PICKER_HEIGHT, overflow: 'hidden' }}>
        <Animated.View style={[{ paddingVertical: SIDE_PADDING }, contentStyle]}>
          {items.map((item, i) => (
            <View key={i} style={{ height: ITEM_HEIGHT }} className="items-center justify-center">
              <Text className="titleSmall text-black">{renderLabel(item)}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

interface TimeWheelsProps {
  readonly initial: ParsedTime;
  readonly onConfirm: (value: string) => void;
}

// 바텀시트가 열릴 때만 마운트되므로, 매번 마지막 확정 시간(initial)에서
// 새로 시작한다 — 재오픈 시 상태를 되돌리는 별도 동기화 로직이 필요 없다.
function TimeWheels({ initial, onConfirm }: TimeWheelsProps) {
  const [periodIndex, setPeriodIndex] = useState(() => PERIOD_ITEMS.indexOf(initial.period));
  const [hourIndex, setHourIndex] = useState(() => HOUR_ITEMS.indexOf(initial.hour));
  const [minuteIndex, setMinuteIndex] = useState(() => MINUTE_ITEMS.indexOf(initial.minute));

  const handleConfirm = () => {
    onConfirm(
      toTimeValue(PERIOD_ITEMS[periodIndex], HOUR_ITEMS[hourIndex], MINUTE_ITEMS[minuteIndex])
    );
  };

  return (
    <View className="flex-1 gap-4">
      <View style={{ height: PICKER_HEIGHT }} className="relative">
        <View
          pointerEvents="none"
          style={{ top: SIDE_PADDING, height: ITEM_HEIGHT }}
          className="absolute left-0 right-0 rounded-xl bg-gray-50"
        />

        <View className="flex-1 flex-row">
          <View className="flex-1">
            <WheelColumn
              items={PERIOD_ITEMS}
              initialIndex={periodIndex}
              onChangeIndex={setPeriodIndex}
              renderLabel={(item) => item}
            />
          </View>
          <View className="flex-1">
            <WheelColumn
              items={HOUR_ITEMS}
              initialIndex={hourIndex}
              onChangeIndex={setHourIndex}
              renderLabel={(item) => `${item}시`}
            />
          </View>
          <View className="flex-1">
            <WheelColumn
              items={MINUTE_ITEMS}
              initialIndex={minuteIndex}
              onChangeIndex={setMinuteIndex}
              renderLabel={(item) => `${String(item).padStart(2, '0')}분`}
            />
          </View>
        </View>
      </View>

      <Button variant="primary" onPress={handleConfirm} width="w-full">
        <Text className="text-white">확인</Text>
      </Button>
    </View>
  );
}

interface ReservationTimeSheetProps {
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly selectedTime?: string;
  readonly onSelect: (time: string) => void;
}

export function ReservationTimeSheet({
  isVisible,
  onClose,
  selectedTime,
  onSelect,
}: ReservationTimeSheetProps) {
  const initial = useMemo(() => parseTime(selectedTime), [selectedTime]);

  const handleConfirm = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={onClose}
      title="시작 시간 선택"
      height={PICKER_HEIGHT + 220}>
      {isVisible ? <TimeWheels initial={initial} onConfirm={handleConfirm} /> : null}
    </BottomSheetModalWrapper>
  );
}
