import { formatDate } from '../formatDate';

const FIXED_NOW = new Date('2024-01-15T12:00:00.000Z');

const msAgo = (ms: number) => new Date(FIXED_NOW.getTime() - ms).toISOString();

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('formatDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('방금 전 (1분 미만)', () => {
    it('현재 시각과 동일하면 방금 전을 반환한다', () => {
      expect(formatDate(FIXED_NOW.toISOString())).toBe('방금 전');
    });

    it('30초 전은 방금 전을 반환한다', () => {
      expect(formatDate(msAgo(30 * SEC))).toBe('방금 전');
    });

    it('59초 전은 방금 전을 반환한다', () => {
      expect(formatDate(msAgo(59 * SEC))).toBe('방금 전');
    });
  });

  describe('N분 전 (1분 이상 60분 미만)', () => {
    it('정확히 1분 전은 1분 전을 반환한다', () => {
      expect(formatDate(msAgo(1 * MIN))).toBe('1분 전');
    });

    it('30분 전은 30분 전을 반환한다', () => {
      expect(formatDate(msAgo(30 * MIN))).toBe('30분 전');
    });

    it('59분 전은 59분 전을 반환한다', () => {
      expect(formatDate(msAgo(59 * MIN))).toBe('59분 전');
    });
  });

  describe('N시간 전 (1시간 이상 24시간 미만)', () => {
    it('정확히 60분 전은 1시간 전을 반환한다', () => {
      expect(formatDate(msAgo(60 * MIN))).toBe('1시간 전');
    });

    it('12시간 전은 12시간 전을 반환한다', () => {
      expect(formatDate(msAgo(12 * HOUR))).toBe('12시간 전');
    });

    it('23시간 전은 23시간 전을 반환한다', () => {
      expect(formatDate(msAgo(23 * HOUR))).toBe('23시간 전');
    });
  });

  describe('N일 전 (1일 이상 7일 미만)', () => {
    it('정확히 24시간 전은 1일 전을 반환한다', () => {
      expect(formatDate(msAgo(24 * HOUR))).toBe('1일 전');
    });

    it('3일 전은 3일 전을 반환한다', () => {
      expect(formatDate(msAgo(3 * DAY))).toBe('3일 전');
    });

    it('6일 전은 6일 전을 반환한다', () => {
      expect(formatDate(msAgo(6 * DAY))).toBe('6일 전');
    });
  });

  describe('날짜 형식 (7일 이상)', () => {
    it('정확히 7일 전은 날짜 형식으로 반환한다', () => {
      const date = new Date(msAgo(7 * DAY));
      expect(formatDate(date.toISOString())).toBe(
        date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      );
    });

    it('30일 전은 날짜 형식으로 반환한다', () => {
      const date = new Date(msAgo(30 * DAY));
      expect(formatDate(date.toISOString())).toBe(
        date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      );
    });

    it('365일 전은 날짜 형식으로 반환한다', () => {
      const date = new Date(msAgo(365 * DAY));
      expect(formatDate(date.toISOString())).toBe(
        date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      );
    });
  });

  describe('에러 처리', () => {
    it('유효하지 않은 날짜 문자열은 "Invalid Date"를 반환한다', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });

    it('빈 문자열은 "Invalid Date"를 반환한다', () => {
      expect(formatDate('')).toBe('Invalid Date');
    });

    it('임의의 문자열은 "Invalid Date"를 반환한다', () => {
      expect(formatDate('not a date at all')).toBe('Invalid Date');
    });
  });
});
