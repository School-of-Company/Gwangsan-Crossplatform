import { publicInstance } from '~/shared/lib/publicInstance';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export interface VerifyPasswordResetSmsRequest {
  phoneNumber: string;
  code: string;
}

export const verifyPasswordResetSms = async (
  request: VerifyPasswordResetSmsRequest
): Promise<void> => {
  try {
    await publicInstance.post('/sms/password/verify', request);
  } catch (error) {
    logger.error('verifyPasswordResetSms failed', error);
    throw toAppError(error);
  }
};
