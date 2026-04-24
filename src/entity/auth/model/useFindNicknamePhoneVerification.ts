import { sendFindNicknameSms } from '~/entity/auth/api/sendFindNicknameSms';
import { verifyFindNicknameSms } from '~/entity/auth/api/verifyFindNicknameSms';
import { usePhoneVerification } from './usePhoneVerification';

export const useFindNicknamePhoneVerification = () =>
  usePhoneVerification({
    sendSmsApi: sendFindNicknameSms,
    verifySmsApi: verifyFindNicknameSms,
  });
