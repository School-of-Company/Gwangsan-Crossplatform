import { API_URL } from '@env';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const verifySms = async (phoneNumber: string, code: string) => {
  try {
    const response = await fetch(`${API_URL}/sms/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, code }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      logger.warn('verifySms: non-JSON response');
      data = {};
    }

    return data;
  } catch (error) {
    logger.error('verifySms failed', error);
    throw toAppError(error);
  }
};
