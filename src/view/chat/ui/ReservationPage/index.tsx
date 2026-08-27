import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { Button, Dropdown, Header, Input } from '~/shared/ui';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { useChatMessages } from '~/widget/chat/model/useChatMessages';
import { useTradeHandlers } from '~/widget/chat/model/useTradeHandlers';
import { logger } from '~/shared/lib/logger';
import type { RoomId } from '~/shared/types/chatType';

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

export default function ReservationPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id) as RoomId;
  const router = useRouter();

  const { data: roomData } = useChatRoomData({ roomId });
  const { otherUserInfo } = useChatMessages({ roomId });
  const { handleReservation } = useTradeHandlers({
    roomId,
    roomData: roomData || null,
    otherUserInfo,
  });

  const [date, setDate] = useState<string | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [place, setPlace] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dateOptions = useMemo(() => buildDateOptions(), []);
  const timeOptions = useMemo(() => buildTimeOptions(), []);

  const canConfirm =
    Boolean(date) && Boolean(time) && place.trim().length > 0 && address.trim().length > 0;

  const handleConfirm = useCallback(async () => {
    if (!date || !time || !canConfirm) return;

    try {
      setIsLoading(true);
      await handleReservation({
        scheduledAt: `${date}T${time}:00`,
        placeName: place.trim(),
        address: address.trim(),
      });
      router.back();
    } catch (error) {
      logger.error('handleReservationConfirm failed', error);
    } finally {
      setIsLoading(false);
    }
  }, [date, time, place, address, canConfirm, handleReservation, router]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="예약하기" />
      <View className="flex-1 justify-between gap-4 px-4 py-4">
        <View className="gap-4">
          {otherUserInfo.nickname ? (
            <Text className="titleMedium text-gray-900">
              {otherUserInfo.nickname}님과의 거래 약속
            </Text>
          ) : null}

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

        <Button
          variant="primary"
          onPress={handleConfirm}
          disabled={!canConfirm || isLoading}
          width="w-full">
          <Text className="text-white">{isLoading ? '예약 중...' : '예약하기'}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
