import { createUserSessionService } from '@/entity/auth/lib/userSessionService';

const userSessionService = createUserSessionService();

export const getCurrentUserId = async (): Promise<number> => {
  return userSessionService.getCurrentUserId();
};

export const clearCurrentUserId = (): void => {
  userSessionService.clearSession();
};
