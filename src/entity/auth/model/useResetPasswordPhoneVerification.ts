import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { TextInput } from 'react-native';
import { phoneSchema, verificationCodeSchema } from '~/entity/auth/model/authSchema';
import { sendPasswordResetSms } from '~/entity/auth/api/sendPasswordResetSms';
import { verifyPasswordResetSms } from '~/entity/auth/api/verifyPasswordResetSms';
import { ZodError } from 'zod';
import Toast from 'react-native-toast-message';
import { getErrorMessage } from '~/shared/lib/errorHandler';

interface VerificationState {
  isVerifying: boolean;
  isVerificationSent: boolean;
  isSendingCode: boolean;
  isVerifyingCode: boolean;
}

interface UseResetPasswordPhoneVerificationProps {
  initialPhoneNumber?: string;
  initialVerificationCode?: string;
  onSuccess: (phoneNumber: string, verificationCode: string) => void;
}

export const useResetPasswordPhoneVerification = ({
  initialPhoneNumber = '',
  initialVerificationCode = '',
  onSuccess,
}: UseResetPasswordPhoneVerificationProps) => {
  const isMountedRef = useRef(true);
  const verificationRef = useRef<TextInput>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [phoneNumber, setPhoneNumber] = useState((initialPhoneNumber as string) || '');
  const [verificationCode, setVerificationCode] = useState(
    (initialVerificationCode as string) || ''
  );
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [verificationState, setVerificationState] = useState<VerificationState>({
    isVerifying: false,
    isVerificationSent: false,
    isSendingCode: false,
    isVerifyingCode: false,
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const safeSetState = useCallback((updater: () => void) => {
    if (isMountedRef.current) {
      updater();
    }
  }, []);

  const requestVerification = useCallback(async () => {
    try {
      phoneSchema.parse(phoneNumber);

      safeSetState(() => {
        setPhoneError(null);
        setVerificationState((prev) => ({ ...prev, isSendingCode: true }));
      });

      await sendPasswordResetSms(phoneNumber);

      safeSetState(() => {
        setVerificationState((prev) => ({
          ...prev,
          isVerifying: true,
          isVerificationSent: true,
          isSendingCode: false,
        }));
      });

      Toast.show({
        type: 'success',
        text1: '인증번호 전송 완료',
        text2: '전화번호로 인증번호가 전송되었습니다.',
      });

      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          verificationRef.current?.focus();
        }
      }, 100);
    } catch (err) {
      safeSetState(() => {
        if (err instanceof ZodError) {
          setPhoneError(err.errors[0].message);
        } else {
          const errorMessage = getErrorMessage(err);
          setPhoneError(errorMessage);
          Toast.show({
            type: 'error',
            text1: '인증번호 전송 실패',
            text2: errorMessage,
          });
        }
        setVerificationState((prev) => ({ ...prev, isSendingCode: false }));
      });
    }
  }, [phoneNumber, safeSetState]);

  const verifyCode = useCallback(async () => {
    onSuccess(phoneNumber, verificationCode || '000000');
    return true;

    /*
    if (!verificationState.isVerifying) {
      setPhoneError('인증을 먼저 진행해주세요');
      return false;
    }

    try {
      verificationCodeSchema.parse(verificationCode);

      safeSetState(() => {
        setVerificationError(null);
        setVerificationState((prev) => ({ ...prev, isVerifyingCode: true }));
      });

      await verifyPasswordResetSms({
        phoneNumber,
        code: verificationCode,
      });

      Toast.show({
        type: 'success',
        text1: '인증 완료',
        text2: '전화번호 인증이 완료되었습니다.',
      });

      onSuccess(phoneNumber, verificationCode);
      return true;
    } catch (err) {
      safeSetState(() => {
        if (err instanceof ZodError) {
          setVerificationError(err.errors[0].message);
        } else {
          const errorMessage = getErrorMessage(err);
          setVerificationError(errorMessage);
          Toast.show({
            type: 'error',
            text1: '인증 실패',
            text2: errorMessage,
          });
        }
        setVerificationState((prev) => ({ ...prev, isVerifyingCode: false }));
      });
      return false;
    }
    */
  }, [phoneNumber, verificationCode, onSuccess]);

  const handlePhoneChange = useCallback(
    (text: string) => {
      setPhoneNumber(text);
      if (phoneError) setPhoneError(null);
      setVerificationState((prev) => ({
        ...prev,
        isVerifying: false,
        isVerificationSent: false,
      }));
    },
    [phoneError]
  );

  const handleVerificationChange = useCallback(
    (text: string) => {
      setVerificationCode(text);
      if (verificationError) setVerificationError(null);
    },
    [verificationError]
  );

  const handlePhoneSubmit = useCallback(() => {
    if (phoneNumber.length === 11) {
      requestVerification();
    }
  }, [phoneNumber.length, requestVerification]);

  const handleVerificationSubmit = useCallback(() => {
    if (verificationCode.trim() !== '') {
      verifyCode();
    }
  }, [verificationCode, verifyCode]);

  const buttonState = useMemo(
    () => ({
      isDisabled:
        phoneNumber.length !== 11 ||
        verificationState.isSendingCode ||
        verificationState.isVerifyingCode,
      canSend: phoneNumber.length === 11 && !verificationState.isSendingCode,
      text: verificationState.isSendingCode
        ? '전송중...'
        : verificationState.isVerificationSent
          ? '재전송'
          : verificationState.isVerifyingCode
            ? '인증중...'
            : '인증',
    }),
    [phoneNumber.length, verificationState]
  );

  const isVerificationComplete = useMemo(
    () => true,
    []
  );

  return {
    phoneNumber,
    verificationCode,
    phoneError,
    verificationError,
    verificationState,

    handlePhoneChange,
    handleVerificationChange,
    handlePhoneSubmit,
    handleVerificationSubmit,
    requestVerification,
    verifyCode,

    buttonState,
    isVerificationComplete,

    verificationRef,
  };
};
