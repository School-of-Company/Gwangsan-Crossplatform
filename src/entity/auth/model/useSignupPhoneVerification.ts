import { sendSms } from '~/entity/auth/api/sendSms';
import { verifySms } from '~/entity/auth/api/verifySms';
import { usePhoneVerification } from './usePhoneVerification';

interface UseSignupPhoneVerificationProps {
  initialPhoneNumber?: string;
  initialVerificationCode?: string;
}

export const useSignupPhoneVerification = ({
  initialPhoneNumber = '',
  initialVerificationCode = '',
}: UseSignupPhoneVerificationProps) =>
  usePhoneVerification({
    initialPhoneNumber,
    initialVerificationCode,
    sendSmsApi: sendSms,
    verifySmsApi: verifySms,
  });
