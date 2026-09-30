import { z } from 'zod';

// 라우트 파라미터/쿼리 등 외부에서 들어온 값을 서버 API 경로에 그대로 꽂아 넣기 전에
// 검증한다. 1 이상의 정수(선행 0 없음) 문자열만 허용하며, 0/음수/NaN/임의 문자열이
// API 경로로 흘러들어가는 것을 막는다.
const idSchema = z.string().regex(/^[1-9]\d*$/, '유효하지 않은 ID입니다');

/** id가 양의 정수 문자열이 아니면 throw. 검증 통과 시 그대로 반환한다. */
export const assertValidId = (id: string): string => {
  idSchema.parse(id);
  return id;
};

/** id가 양의 정수 문자열인지 여부만 확인한다 (throw 없이 boolean으로 쓰고 싶을 때). */
export const isValidId = (id: string | undefined): boolean => idSchema.safeParse(id).success;
