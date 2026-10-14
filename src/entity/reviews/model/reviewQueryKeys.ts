// 후기 쿼리 키. 예전에는 화면마다 배열을 직접 적어, 같은 "내가 쓴 후기"를 ChatRoomPage는
// ['reviews','toss'], useGetReviews는 ['reviews','toss',null]로 따로 캐시·조회했다(#741)
export const reviewKeys = {
  all: ['reviews'] as const,
  toss: () => [...reviewKeys.all, 'toss'] as const,
  // target: 내 받은 후기면 'current', 다른 회원이면 그 회원 id
  received: (target: string | undefined) => [...reviewKeys.all, 'receive', target] as const,
  receivedInfinite: (target: string | undefined, pageSize: number) =>
    [...reviewKeys.all, 'receive', 'infinite', target, pageSize] as const,
} as const;
