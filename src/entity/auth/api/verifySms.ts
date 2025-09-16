import { API_URL } from '@env';

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

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(parseError, responseText);
      throw new Error(responseText.substring(0, 100));
    }

    if (!response.ok) {
      const errorMessage = data.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('SMS 인증 요청 중 알 수 없는 오류가 발생했습니다.');
  }
};
