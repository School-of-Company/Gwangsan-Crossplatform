// 후기 쿼리 키. 같은 후기를 화면마다 다른 키로 캐시하지 않도록 여기서만 만든다
export const reviewKeys = {
  all: ['reviews'] as const,
  toss: () => [...reviewKeys.all, 'toss'] as const,
  // target: 내 받은 후기면 'current', 다른 회원이면 그 회원 id
  received: (target: string | undefined) => [...reviewKeys.all, 'receive', target] as const,
  receivedInfinite: (target: string | undefined, pageSize: number) =>
    [...reviewKeys.all, 'receive', 'infinite', target, pageSize] as const,
} as const;
