import { createUserSessionService } from '@/entity/auth/lib/userSessionService';

export const getCurrentUserId = async (): Promise<number> => {
  return createUserSessionService().getCurrentUserId();
};

export const clearCurrentUserId = (): void => {
  createUserSessionService().clearSession();
};
