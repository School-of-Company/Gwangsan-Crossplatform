import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { TextInput } from 'react-native';
import { phoneSchema, verificationCodeSchema } from '~/entity/auth/model/authSchema';
import { sendSms } from '~/entity/auth/api/sendSms';
import { verifySms } from '~/entity/auth/api/verifySms';
import { ZodError } from 'zod';
import Toast from 'react-native-toast-message';

interface VerificationState {
  isVerifying: boolean;
  isVerificationSent: boolean;
  isSendingCode: boolean;
  isVerifyingCode: boolean;
}

interface UsePhoneVerificationProps {
  initialPhoneNumber?: string;
  initialVerificationCode?: string;
  onSuccess: (phoneNumber: string, verificationCode: string) => void;
}

export const usePhoneVerification = ({
  initialPhoneNumber = '',
  initialVerificationCode = '',
  onSuccess,
}: UsePhoneVerificationProps) => {
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

      await sendSms(phoneNumber);

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
        } else if (err instanceof Error) {
          setPhoneError(err.message);
          Toast.show({
            type: 'error',
            text1: '인증번호 전송 실패',
            text2: err.message,
          });
        } else {
          setPhoneError('유효하지 않은 전화번호입니다');
        }
        setVerificationState((prev) => ({ ...prev, isSendingCode: false }));
      });
    }
  }, [phoneNumber, safeSetState]);

  const verifyCode = useCallback(async () => {
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

      await verifySms(phoneNumber, verificationCode);

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
          setVerificationError('인증번호가 일치하지 않습니다');
          Toast.show({
            type: 'error',
            text1: '인증 실패',
            text2: '인증번호가 일치하지 않습니다. 다시 확인해주세요.',
          });
        }
        setVerificationState((prev) => ({ ...prev, isVerifyingCode: false }));
      });
      return false;
    }
  }, [verificationState.isVerifying, verificationCode, phoneNumber, safeSetState, onSuccess]);

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
    () =>
      verificationState.isVerifying &&
      verificationCode.trim() !== '' &&
      !verificationState.isVerifyingCode,
    [verificationState.isVerifying, verificationState.isVerifyingCode, verificationCode]
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
