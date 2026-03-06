import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { TextInput } from 'react-native';
import { phoneSchema, verificationCodeSchema } from '~/entity/auth/model/authSchema';
import { ZodError } from 'zod';
import Toast from 'react-native-toast-message';
import { getErrorMessage } from '~/shared/lib/errorHandler';

interface VerificationState {
  isVerifying: boolean;
  isSendingCode: boolean;
  isVerifyingCode: boolean;
}

export interface UsePhoneVerificationProps {
  initialPhoneNumber?: string;
  initialVerificationCode?: string;
  sendSmsApi: (phoneNumber: string) => Promise<void>;
  verifySmsApi: (phoneNumber: string, code: string) => Promise<unknown>;
}

export const usePhoneVerification = ({
  initialPhoneNumber = '',
  initialVerificationCode = '',
  sendSmsApi,
  verifySmsApi,
}: UsePhoneVerificationProps) => {
  const isMountedRef = useRef(true);
  const verificationRef = useRef<TextInput>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const phoneNumberRef = useRef(phoneNumber);
  phoneNumberRef.current = phoneNumber;
  const [verificationCode, setVerificationCode] = useState(initialVerificationCode);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const [verificationState, setVerificationState] = useState<VerificationState>({
    isVerifying: false,
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

      await sendSmsApi(phoneNumber);

      safeSetState(() => {
        setVerificationState((prev) => ({
          ...prev,
          isVerifying: true,
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
  }, [phoneNumber, safeSetState, sendSmsApi]);

  const verifyCode = useCallback(async () => {
    if (!verificationState.isVerifying) {
      setPhoneError('인증을 먼저 진행해주세요');
      return false;
    }

    const phoneAtVerificationStart = phoneNumber;

    try {
      verificationCodeSchema.parse(verificationCode);

      safeSetState(() => {
        setVerificationError(null);
        setVerificationState((prev) => ({ ...prev, isVerifyingCode: true }));
      });

      await verifySmsApi(phoneAtVerificationStart, verificationCode);

      safeSetState(() => {
        if (phoneNumberRef.current !== phoneAtVerificationStart) {
          setVerificationState((prev) => ({ ...prev, isVerifyingCode: false }));
          return;
        }
        setIsVerified(true);
        setVerificationState((prev) => ({ ...prev, isVerifyingCode: false }));
      });

      Toast.show({
        type: 'success',
        text1: '인증 완료',
        text2: '전화번호 인증이 완료되었습니다.',
      });

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
  }, [verificationState.isVerifying, verificationCode, phoneNumber, safeSetState, verifySmsApi]);

  const handlePhoneChange = useCallback((text: string) => {
    setPhoneNumber(text);
    setPhoneError(null);
    setIsVerified(false);
    setVerificationState((prev) => ({ ...prev, isVerifying: false }));
  }, []);

  const handleVerificationChange = useCallback((text: string) => {
    setVerificationCode(text);
    setVerificationError(null);
  }, []);

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
      text: verificationState.isSendingCode
        ? '전송중...'
        : verificationState.isVerifying
          ? '재전송'
          : '인증',
    }),
    [phoneNumber.length, verificationState]
  );

  const verifyButtonState = useMemo(
    () => ({
      isDisabled: verificationCode.trim() === '' || verificationState.isVerifyingCode || isVerified,
      text: verificationState.isVerifyingCode ? '인증중...' : isVerified ? '인증완료' : '인증',
    }),
    [verificationCode, verificationState.isVerifyingCode, isVerified]
  );

  const isVerificationComplete = isVerified;

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
    verifyButtonState,
    isVerificationComplete,

    verificationRef,
  };
};
