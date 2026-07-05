import { API_BASE_URL } from '~/shared/consts/api';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

export const sendSms = async (phoneNumber: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
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
    logger.error('sendSms failed', error);
    throw toAppError(error);
  }
};
