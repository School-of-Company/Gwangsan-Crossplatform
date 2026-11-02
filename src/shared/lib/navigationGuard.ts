// 목록에서 항목을 빠르게 두 번 누르면 router.push가 두 번 불려 같은 화면이 두 번 쌓인다.
// 화면 전환이 시작되는 동안 들어온 이동 요청은 무시한다. 서로 다른 항목을 연달아 눌러
// 화면이 두 개 열리는 것도 막도록 앱 전체에서 하나의 잠금을 쓴다.
export const NAVIGATION_GUARD_MS = 600;

let lastNavigatedAt: number | null = null;

// 이동해도 되면 잠금을 잡고 true를, 직전 이동 직후라면 false를 반환한다.
export const acquireNavigationLock = (): boolean => {
  const now = Date.now();
  if (lastNavigatedAt !== null && now - lastNavigatedAt < NAVIGATION_GUARD_MS) return false;
  lastNavigatedAt = now;
  return true;
};

export const resetNavigationLock = () => {
  lastNavigatedAt = null;
};
