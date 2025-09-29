export function getLightColor(level: number): string {
  switch (true) {
    case level <= 1:
      return 'text-black';
    case level <= 10:
      return 'text-sub2-900';
    case level <= 20:
      return 'text-sub2-800';
    case level <= 30:
      return 'text-sub2-700';
    case level <= 40:
      return 'text-sub2-600';
    case level <= 50:
      return 'text-sub2-500';
    case level <= 60:
      return 'text-sub2-400';
    case level <= 70:
      return 'text-sub2-300';
    case level <= 80:
      return 'text-sub2-200';
    case level <= 90:
      return 'text-sub2-100';
    default:
      return 'text-white';
  }
}
