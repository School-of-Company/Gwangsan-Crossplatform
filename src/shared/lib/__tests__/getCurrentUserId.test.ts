import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { getCurrentUserId, clearCurrentUserId } from '../getCurrentUserId';

let mockService: any;

// 팩토리 안에서 서비스를 생성하고 외부 변수에 할당 — clearAllMocks 이후에도 참조 유지
jest.mock('@/entity/auth/lib/userSessionService', () => ({
  createUserSessionService: jest.fn(() => {
    mockService = {
      getCurrentUserId: jest.fn(),
      clearSession: jest.fn(),
      getCurrentSession: jest.fn(),
      isSessionValid: jest.fn(),
    };
    return mockService;
  }),
}));

describe('getCurrentUserId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('userSessionService.getCurrentUserId 결과를 반환한다', async () => {
    mockService.getCurrentUserId.mockResolvedValue(42);

    const result = await getCurrentUserId();

    expect(mockService.getCurrentUserId).toHaveBeenCalledTimes(1);
    expect(result).toBe(42);
  });

  it('세션이 없으면 에러를 전파한다', async () => {
    mockService.getCurrentUserId.mockRejectedValue(new Error('Authentication required'));

    await expect(getCurrentUserId()).rejects.toThrow('Authentication required');
  });
});

describe('clearCurrentUserId', () => {
  it('userSessionService.clearSession을 호출한다', () => {
    clearCurrentUserId();

    expect(mockService.clearSession).toHaveBeenCalledTimes(1);
  });
});
