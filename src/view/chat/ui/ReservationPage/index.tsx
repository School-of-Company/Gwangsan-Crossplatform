import { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { Button, Header } from '~/shared/ui';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { useChatMessages } from '~/widget/chat/model/useChatMessages';
import { useTradeHandlers } from '~/widget/chat/model/useTradeHandlers';
import { ReservationCalendarSheet } from '~/view/chat/ui/ReservationCalendarSheet';
import { ReservationTimeSheet } from '~/view/chat/ui/ReservationTimeSheet';
import { useReservationLocationStore } from '~/shared/store/useReservationLocationStore';
import { logger } from '~/shared/lib/logger';
import type { RoomId } from '~/shared/types/chatType';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const DATE_OPTION_COUNT = 21;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDateLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  const isToday = startOfDay(date).getTime() === startOfDay(new Date()).getTime();
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABELS[date.getDay()]})${isToday ? ' · 오늘' : ''}`;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isTimeSheetVisible, setIsTimeSheetVisible] = useState(false);

  const {
    latitude,
    longitude,
    address,
    placeName,
    reset: resetLocation,
  } = useReservationLocationStore();

  const minDate = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => {
    const today = new Date();
    return startOfDay(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + DATE_OPTION_COUNT - 1)
    );
  }, []);

  const hasLocation = latitude !== null && longitude !== null && placeName.trim().length > 0;
  const canConfirm = Boolean(date) && Boolean(time) && hasLocation;

  const handleConfirm = useCallback(async () => {
    if (!date || !time || !canConfirm || latitude === null || longitude === null) return;

    try {
      setIsLoading(true);
      await handleReservation({
        scheduledAt: `${date}T${time}:00`,
        placeName: placeName.trim(),
        address: address.trim(),
        latitude,
        longitude,
      });
      resetLocation();
      router.back();
    } catch (error) {
      logger.error('handleReservationConfirm failed', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    date,
    time,
    canConfirm,
    latitude,
    longitude,
    placeName,
    address,
    handleReservation,
    resetLocation,
    router,
  ]);

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

          <View className="w-full gap-2">
            <Text className="text-label text-black">날짜</Text>
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-gray-400 px-4 py-5"
              onPress={() => setIsCalendarVisible(true)}>
              <Text>{date ? formatDateLabel(date) : '날짜를 선택해주세요'}</Text>
              <Icon name="calendar-outline" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          <View className="w-full gap-2">
            <Text className="text-label text-black">시간</Text>
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-gray-400 px-4 py-5"
              onPress={() => setIsTimeSheetVisible(true)}>
              <Text>{time || '시간을 선택해주세요'}</Text>
              <Icon name="time-outline" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          <View className="w-full gap-2">
            <Text className="text-label text-black">장소</Text>
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-gray-400 px-4 py-5"
              onPress={() => router.push(`/chatting/${id}/reservation/map`)}>
              <View className="flex-1 gap-1">
                <Text numberOfLines={1}>{placeName || '장소를 선택해주세요'}</Text>
                {hasLocation ? (
                  <Text className="caption text-gray-500" numberOfLines={1}>
                    {address}
                  </Text>
                ) : null}
              </View>
              <Icon name="location-outline" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <Button
          variant="primary"
          onPress={handleConfirm}
          disabled={!canConfirm || isLoading}
          width="w-full">
          <Text className="text-white">{isLoading ? '예약 중...' : '예약하기'}</Text>
        </Button>
      </View>

      <ReservationCalendarSheet
        isVisible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        selectedDate={date}
        onSelect={setDate}
        minDate={minDate}
        maxDate={maxDate}
      />

      <ReservationTimeSheet
        isVisible={isTimeSheetVisible}
        onClose={() => setIsTimeSheetVisible(false)}
        selectedTime={time}
        onSelect={setTime}
      />
    </SafeAreaView>
  );
}
