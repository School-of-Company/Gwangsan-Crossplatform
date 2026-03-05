import { sendPasswordResetSms } from '~/entity/auth/api/sendPasswordResetSms';
import { verifyPasswordResetSms } from '~/entity/auth/api/verifyPasswordResetSms';
import { usePhoneVerificationBase } from './usePhoneVerificationBase';

interface UseResetPasswordPhoneVerificationProps {
  initialPhoneNumber?: string;
  initialVerificationCode?: string;
  onSuccess: (phoneNumber: string, verificationCode: string) => void;
}

export const useResetPasswordPhoneVerification = ({
  initialPhoneNumber = '',
  initialVerificationCode = '',
}: UseResetPasswordPhoneVerificationProps) =>
  usePhoneVerificationBase({
    initialPhoneNumber,
    initialVerificationCode,
    sendSmsApi: sendPasswordResetSms,
    verifySmsApi: (phoneNumber, code) => verifyPasswordResetSms({ phoneNumber, code }),
  });
