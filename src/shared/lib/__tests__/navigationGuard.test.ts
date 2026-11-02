import {
  acquireNavigationLock,
  NAVIGATION_GUARD_MS,
  resetNavigationLock,
} from '../navigationGuard';

let now = 1_000_000;

beforeEach(() => {
  resetNavigationLock();
  jest.spyOn(Date, 'now').mockImplementation(() => now);
});

afterEach(() => jest.restoreAllMocks());

describe('acquireNavigationLock', () => {
  it('처음 이동은 허용한다', () => {
    expect(acquireNavigationLock()).toBe(true);
  });

  it('잠금 시간 안에 들어온 이동은 막는다', () => {
    acquireNavigationLock();
    now += NAVIGATION_GUARD_MS - 1;

    expect(acquireNavigationLock()).toBe(false);
  });

  it('잠금 시간이 지나면 다시 이동할 수 있다', () => {
    acquireNavigationLock();
    now += NAVIGATION_GUARD_MS;

    expect(acquireNavigationLock()).toBe(true);
  });

  it('막힌 요청은 잠금 시간을 늘리지 않는다', () => {
    acquireNavigationLock();
    now += NAVIGATION_GUARD_MS - 1;
    acquireNavigationLock();
    now += 1;

    expect(acquireNavigationLock()).toBe(true);
  });

  it('resetNavigationLock 후에는 바로 이동할 수 있다', () => {
    acquireNavigationLock();
    resetNavigationLock();

    expect(acquireNavigationLock()).toBe(true);
  });
});
