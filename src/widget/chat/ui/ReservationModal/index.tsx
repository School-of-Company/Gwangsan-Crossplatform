import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { BottomSheetModalWrapper, Button, Dropdown, Input } from '~/shared/ui';

export interface ReservationConfirmPayload {
  readonly scheduledAt: string;
  readonly placeName: string;
  readonly address: string;
}

interface ReservationModalProps {
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (payload: ReservationConfirmPayload) => void;
  readonly onAnimationComplete?: () => void;
  readonly isLoading?: boolean;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const DATE_OPTION_COUNT = 14;
const TIME_START_HOUR = 9;
const TIME_END_HOUR = 21;

const buildDateOptions = () => {
  const options: { value: string; label: string }[] = [];
  const today = new Date();

  for (let i = 0; i < DATE_OPTION_COUNT; i += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const label = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABELS[date.getDay()]})${i === 0 ? ' · 오늘' : ''}`;
    options.push({ value, label });
  }

  return options;
};

const buildTimeOptions = () => {
  const options: { value: string; label: string }[] = [];

  for (let hour = TIME_START_HOUR; hour <= TIME_END_HOUR; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === TIME_END_HOUR && minute === 30) continue;
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      options.push({ value, label: value });
    }
  }

  return options;
};

const ReservationModalComponent: React.FC<ReservationModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  onAnimationComplete,
  isLoading = false,
}) => {
  const [date, setDate] = useState<string | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [place, setPlace] = useState('');
  const [address, setAddress] = useState('');

  const dateOptions = useMemo(() => buildDateOptions(), []);
  const timeOptions = useMemo(() => buildTimeOptions(), []);

  const canConfirm =
    Boolean(date) && Boolean(time) && place.trim().length > 0 && address.trim().length > 0;

  const resetFields = useCallback(() => {
    setDate(undefined);
    setTime(undefined);
    setPlace('');
    setAddress('');
  }, []);

  const handleClose = useCallback(() => {
    resetFields();
    onClose();
  }, [onClose, resetFields]);

  const handleConfirm = useCallback(() => {
    if (!date || !time || !canConfirm) return;
    onConfirm({
      scheduledAt: `${date}T${time}:00`,
      placeName: place.trim(),
      address: address.trim(),
    });
    resetFields();
  }, [date, time, place, address, canConfirm, onConfirm, resetFields]);

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={handleClose}
      onAnimationComplete={onAnimationComplete}
      title="예약 정보 입력"
      height={640}>
      <View className="flex-1 justify-between gap-4">
        <View className="gap-4">
          <Text className="text-sm text-gray-600">
            거래 상대방과 만날 날짜, 시간, 장소를 선택해주세요. 예약 확정 시 현재 위치가 만날 장소의
            좌표로 함께 저장됩니다.
          </Text>

          <Dropdown
            label="날짜"
            items={dateOptions}
            selectedItem={date}
            onSelect={setDate}
            placeholder="날짜를 선택해주세요"
          />

          <Dropdown
            label="시간"
            items={timeOptions}
            selectedItem={time}
            onSelect={setTime}
            placeholder="시간을 선택해주세요"
          />

          <Input
            label="장소"
            value={place}
            onChangeText={setPlace}
            placeholder="예: 상무역 2번 출구"
            returnKeyType="next"
          />

          <Input
            label="주소"
            value={address}
            onChangeText={setAddress}
            placeholder="예: 광주 서구 상무자유로 20"
            returnKeyType="done"
          />
        </View>

        <View className="gap-3">
          <Button
            variant="primary"
            onPress={handleConfirm}
            disabled={!canConfirm || isLoading}
            width="w-full">
            <Text className="text-white">{isLoading ? '예약 중...' : '예약하기'}</Text>
          </Button>

          <Button variant="neutral" onPress={handleClose} disabled={isLoading} width="w-full">
            <Text className="text-gray-900">닫기</Text>
          </Button>
        </View>
      </View>
    </BottomSheetModalWrapper>
  );
};

export const ReservationModal = memo(ReservationModalComponent);
ReservationModal.displayName = 'ReservationModal';
