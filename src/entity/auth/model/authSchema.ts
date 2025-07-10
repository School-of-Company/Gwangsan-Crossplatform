import { z } from 'zod';

export const nicknameSchema = z
  .string()
  .min(1, '별칭을 입력해주세요')
  .regex(/^[가-힣]+$/, '한글만 입력 가능합니다');

export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다')
  .regex(
    /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
    '영문 대소문자, 숫자, 특수문자만 허용됩니다'
  );

export const passwordConfirmSchema = (password: string) =>
  z.string().refine((value) => value === password, {
    message: '비밀번호가 일치하지 않습니다',
  });

export const phoneSchema = z
  .string()
  .min(11, '전화번호는 11자리여야 합니다')
  .max(11, '전화번호는 11자리여야 합니다')
  .regex(/^[0-9]+$/, '숫자만 입력 가능합니다');

export const verificationCodeSchema = z
  .string()
  .min(1, '인증번호를 입력해주세요')
  .regex(/^[0-9]+$/, '숫자만 입력 가능합니다');

export const descriptionSchema = z
  .string()
  .min(1, '자기소개는 최소 1자 이상 작성해주세요')
  .max(255, '자기소개는 255자 이하로 작성해주세요');
