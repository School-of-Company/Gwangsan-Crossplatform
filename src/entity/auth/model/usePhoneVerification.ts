import { sendSms } from '~/entity/auth/api/sendSms';
import { verifySms } from '~/entity/auth/api/verifySms';
import { usePhoneVerificationBase } from './usePhoneVerificationBase';

interface UsePhoneVerificationProps {
  initialPhoneNumber?: string;
  initialVerificationCode?: string;
}

export const usePhoneVerification = ({
  initialPhoneNumber = '',
  initialVerificationCode = '',
}: UsePhoneVerificationProps) =>
  usePhoneVerificationBase({
    initialPhoneNumber,
    initialVerificationCode,
    sendSmsApi: sendSms,
    verifySmsApi: verifySms,
  });
