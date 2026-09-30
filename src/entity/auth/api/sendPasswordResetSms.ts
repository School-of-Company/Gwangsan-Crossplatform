import { publicInstance } from '~/shared/lib/publicInstance';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const sendPasswordResetSms = async (phoneNumber: string): Promise<void> => {
  try {
    await publicInstance.post('/sms/password', { phoneNumber });
  } catch (error) {
    logger.error('sendPasswordResetSms failed', error);
    throw toAppError(error);
  }
};
