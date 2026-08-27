import { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { BottomSheetModalWrapper } from '~/shared/ui/BottomSheetModalWrapper';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

interface ReservationCalendarSheetProps {
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly selectedDate?: string;
  readonly onSelect: (date: string) => void;
  readonly minDate: Date;
  readonly maxDate: Date;
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const buildCalendarGrid = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
};

export function ReservationCalendarSheet({
  isVisible,
  onClose,
  selectedDate,
  onSelect,
  minDate,
  maxDate,
}: ReservationCalendarSheetProps) {
  const initialMonth = useMemo(() => {
    const base = selectedDate ? new Date(selectedDate) : minDate;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [selectedDate, minDate]);

  const [visibleMonth, setVisibleMonth] = useState(initialMonth);

  const canGoPrev = !isSameMonth(visibleMonth, minDate) && visibleMonth > minDate;
  const canGoNext = !isSameMonth(visibleMonth, maxDate) && visibleMonth < maxDate;

  const grid = useMemo(
    () => buildCalendarGrid(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth]
  );

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    onSelect(formatDateValue(date));
    onClose();
  };

  return (
    <BottomSheetModalWrapper isVisible={isVisible} onClose={onClose} title="날짜 선택" height={500}>
      <View className="flex-1 gap-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={handlePrevMonth} disabled={!canGoPrev} hitSlop={8}>
            <Icon name="chevron-back" size={20} color={canGoPrev ? '#000' : '#D1D5DB'} />
          </TouchableOpacity>
          <Text className="titleSmall text-black">
            {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
          </Text>
          <TouchableOpacity onPress={handleNextMonth} disabled={!canGoNext} hitSlop={8}>
            <Icon name="chevron-forward" size={20} color={canGoNext ? '#000' : '#D1D5DB'} />
          </TouchableOpacity>
        </View>

        <View className="flex-row">
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} className="flex-1 items-center">
              <Text className="caption text-gray-500">{label}</Text>
            </View>
          ))}
        </View>

        <View className="flex-1 flex-row flex-wrap">
          {grid.map((date, i) => {
            if (!date) {
              return (
                <View key={`empty-${i}`} className="aspect-square" style={{ width: '14.28%' }} />
              );
            }

            const day = startOfDay(date);
            const isDisabled = day < minDate || day > maxDate;
            const isSelected = selectedDate === formatDateValue(day);

            return (
              <View
                key={formatDateValue(day)}
                className="aspect-square"
                style={{ width: '14.28%' }}>
                <TouchableOpacity
                  className="flex-1 items-center justify-center"
                  disabled={isDisabled}
                  onPress={() => handleSelectDate(day)}>
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-full ${
                      isSelected ? 'bg-main-500' : ''
                    }`}>
                    <Text
                      className={
                        isSelected ? 'text-white' : isDisabled ? 'text-gray-300' : 'text-black'
                      }>
                      {day.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </BottomSheetModalWrapper>
  );
}
