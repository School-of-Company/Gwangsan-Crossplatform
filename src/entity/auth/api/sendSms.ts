import { publicInstance } from '~/shared/lib/publicInstance';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const sendSms = async (phoneNumber: string): Promise<void> => {
  try {
    await publicInstance.post('/sms', { phoneNumber });
  } catch (error) {
    logger.error('sendSms failed', error);
    throw toAppError(error);
  }
};
