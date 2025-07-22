import { userSessionService } from '@/entity/auth';

export const getCurrentUserId = async (): Promise<number> => {
  return userSessionService.getCurrentUserId();
};

export const clearCurrentUserId = (): void => {
  userSessionService.clearSession();
};
