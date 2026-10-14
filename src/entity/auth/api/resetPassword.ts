import { publicInstance } from '~/shared/lib/publicInstance';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export interface ResetPasswordRequest {
  phoneNumber: string;
  newPassword: string;
}

export const resetPassword = async (request: ResetPasswordRequest): Promise<void> => {
  try {
    await publicInstance.patch('/auth/password', request);
  } catch (error) {
    logger.error('resetPassword failed', error);
    throw toAppError(error);
  }
};
