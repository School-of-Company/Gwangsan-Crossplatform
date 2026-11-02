const pad = (value: number) => String(value).padStart(2, '0');

// 서버는 타임존 없는 LocalDateTime("2026-11-02T10:20:30.123")을 내려준다. 기기 시간대
// 그대로 읽어 날짜만(YYYY.MM.DD) 또는 시각까지(YYYY.MM.DD HH:mm) 보여준다.
export const formatFeedbackDate = (value: string | null | undefined, withTime = false) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
  return withTime ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
};
