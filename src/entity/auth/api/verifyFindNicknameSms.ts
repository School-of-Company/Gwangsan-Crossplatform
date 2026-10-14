import { publicInstance } from '~/shared/lib/publicInstance';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const verifyFindNicknameSms = async (phoneNumber: string, code: string): Promise<void> => {
  try {
    await publicInstance.post('/sms/nickname/verify', { phoneNumber, code });
  } catch (error) {
    logger.error('verifyFindNicknameSms failed', error);
    throw toAppError(error);
  }
};
