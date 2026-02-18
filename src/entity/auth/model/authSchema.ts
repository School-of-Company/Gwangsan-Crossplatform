import { z } from 'zod';

export const nameSchema = z
  .string()
  .trim()
  .min(1, '이름을 입력해주세요')
  .regex(/^[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣0-9 ()~]+$/, '한글, 영문, 숫자만 입력 가능합니다');

export const nicknameSchema = z
  .string()
  .trim()
  .min(1, '별칭을 입력해주세요')
  .regex(/^[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣0-9 ()~]+$/, '한글, 영문, 숫자만 입력 가능합니다');

export const passwordSchema = z
  .string()
  .trim()
  .min(8, '비밀번호는 8자 이상이어야 합니다')
  .regex(
    /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
    '영문 대소문자, 숫자, 특수문자만 허용됩니다'
  );

export const passwordConfirmSchema = (password: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === password, {
      message: '비밀번호가 일치하지 않습니다',
    });

export const phoneSchema = z
  .string()
  .trim()
  .min(11, '전화번호는 11자리여야 합니다')
  .max(11, '전화번호는 11자리여야 합니다')
  .regex(/^[0-9]+$/, '숫자만 입력 가능합니다');

export const verificationCodeSchema = z
  .string()
  .trim()
  .min(1, '인증번호를 입력해주세요')
  .regex(/^[0-9]+$/, '숫자만 입력 가능합니다');

export const descriptionSchema = z
  .string()
  .trim()
  .min(1, '자기소개는 최소 1자 이상 작성해주세요')
  .max(255, '자기소개는 255자 이하로 작성해주세요');

export const specialtiesSchema = z
  .array(z.string())
  .min(1, '특기를 최소 1개 이상 선택해주세요')
  .max(10, '특기는 최대 10개까지 선택 가능합니다');

export const profileEditSchema = z.object({
  nickname: nicknameSchema,
  specialties: specialtiesSchema,
  description: descriptionSchema,
});
