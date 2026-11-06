import { publicInstance } from '~/shared/lib/publicInstance';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const verifySms = async (phoneNumber: string, code: string): Promise<void> => {
  try {
    await publicInstance.post('/sms/verify', { phoneNumber, code });
  } catch (error) {
    logger.requestError('verifySms failed', error);
    throw toAppError(error);
  }
};
