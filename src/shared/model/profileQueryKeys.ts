// 프로필 쿼리 키. 조회 훅은 entity/profile에 있지만 거래 완료·취소 후 광산 잔액을 갱신하려고
// entity/chat 등 다른 슬라이스도 같은 키를 무효화하므로, 모든 레이어가 import할 수 있는 shared에 둔다.
export const profileQueryKeys = {
  // GET /member를 쓰는 두 캐시. 프로필 화면용(myProfile)과 메인·채팅 등 앱 전역용(myInformation)
  myProfile: () => ['myProfile', 'current'] as const,
  myInformation: () => ['myInformation'] as const,
  profileAll: ['profile'] as const,
  profile: (id: string | null | undefined) => [...profileQueryKeys.profileAll, id] as const,
  myPostsAll: ['myPosts'] as const,
  myPosts: () => [...profileQueryKeys.myPostsAll, 'current'] as const,
  memberPostsAll: ['memberPosts'] as const,
  memberPosts: (id: string | null | undefined) => [...profileQueryKeys.memberPostsAll, id] as const,
} as const;
