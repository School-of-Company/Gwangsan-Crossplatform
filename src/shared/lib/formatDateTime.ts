const pad = (value: number) => String(value).padStart(2, '0');

// 서버는 타임존 없는 LocalDateTime("2026-09-08T17:04:25")을 내려준다. 기기 시간대 그대로 읽어
// YYYY.MM.DD HH:mm으로 보여준다. 시각이 없는 날짜("2026-09-08")는 날짜만 보여준다.
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '';
  const hasTime = value.includes('T');
  const date = new Date(hasTime ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const day = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
  return hasTime ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
};
