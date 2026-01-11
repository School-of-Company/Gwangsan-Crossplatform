import { API_URL } from '@env';

export interface VerifyPasswordResetSmsRequest {
  phoneNumber: string;
  code: string;
}

export const verifyPasswordResetSms = async (
  request: VerifyPasswordResetSmsRequest
): Promise<Response> => {
  const response = await fetch(`${API_URL}/sms/password/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(response.status.toString());
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.warn(responseText);
    data = {};
  }

  return data;
};
