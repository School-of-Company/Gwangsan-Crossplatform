// `major.minor.patch`를 숫자로 비교한다. 문자열 비교는 '1.9.0' > '1.10.0'처럼
// 자리수가 늘어나는 순간 뒤집히므로 절대 쓰지 않는다.
const toParts = (version: string): number[] =>
  version
    .trim()
    .split('.')
    .map((part) => {
      const n = Number.parseInt(part, 10);
      return Number.isNaN(n) ? 0 : n;
    });

export const isVersionLower = (current: string, latest: string): boolean => {
  const a = toParts(current);
  const b = toParts(latest);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff < 0;
  }
  return false;
};
