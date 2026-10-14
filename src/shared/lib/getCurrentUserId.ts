import { createUserSessionService } from '~/shared/lib/userSessionService';

const userSessionService = createUserSessionService();

export const getCurrentUserId = async (): Promise<number> => {
  return userSessionService.getCurrentUserId();
};

export const clearCurrentUserId = (): void => {
  userSessionService.clearSession();
};
