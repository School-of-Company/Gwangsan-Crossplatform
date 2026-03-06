import { sendPasswordResetSms } from '~/entity/auth/api/sendPasswordResetSms';
import { verifyPasswordResetSms } from '~/entity/auth/api/verifyPasswordResetSms';
import { usePhoneVerification } from './usePhoneVerification';

interface UsePasswordResetPhoneVerificationProps {
  initialPhoneNumber?: string;
  initialVerificationCode?: string;
}

export const usePasswordResetPhoneVerification = ({
  initialPhoneNumber = '',
  initialVerificationCode = '',
}: UsePasswordResetPhoneVerificationProps) =>
  usePhoneVerification({
    initialPhoneNumber,
    initialVerificationCode,
    sendSmsApi: sendPasswordResetSms,
    verifySmsApi: (phoneNumber, code) => verifyPasswordResetSms({ phoneNumber, code }),
  });
