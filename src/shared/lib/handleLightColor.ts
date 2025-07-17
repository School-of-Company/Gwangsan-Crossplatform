export function getLightColor(level: number): string {
  switch (true) {
    case level <= 1:
      return 'bg-black';
    case level <= 10:
      return 'bg-sub2-900';
    case level <= 20:
      return 'bg-sub2-800';
    case level <= 30:
      return 'bg-sub2-700';
    case level <= 40:
      return 'bg-sub2-600';
    case level <= 50:
      return 'bg-sub2-500';
    case level <= 60:
      return 'bg-sub2-400';
    case level <= 70:
      return 'bg-sub2-300';
    case level <= 80:
      return 'bg-sub2-200';
    case level <= 90:
      return 'bg-sub2-100';
    default:
      return 'bg-white';
  }
}
