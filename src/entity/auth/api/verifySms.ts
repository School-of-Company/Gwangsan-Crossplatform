import { API_BASE_URL } from '~/shared/consts/api';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const verifySms = async (phoneNumber: string, code: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sms/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, code }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const data = JSON.parse(responseText);
        if (data.message) errorMessage = data.message;
      } catch {}
      throw new Error(errorMessage);
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
