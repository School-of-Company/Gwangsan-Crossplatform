import { API_BASE_URL } from '~/shared/consts/api';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const verifyFindNicknameSms = async (phoneNumber: string, code: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sms/nickname/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, code }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const data = JSON.parse(responseText);
        if (data.message) errorMessage = data.message;
      } catch {}
      throw new Error(errorMessage);
    }
  } catch (error) {
    logger.error('verifyFindNicknameSms failed', error);
    throw toAppError(error);
  }
};
