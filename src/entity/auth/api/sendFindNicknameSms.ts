import { publicInstance } from '~/shared/lib/publicInstance';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const sendFindNicknameSms = async (phoneNumber: string): Promise<void> => {
  try {
    await publicInstance.post('/sms/nickname', { phoneNumber });
  } catch (error) {
    logger.error('sendFindNicknameSms failed', error);
    throw toAppError(error);
  }
};
