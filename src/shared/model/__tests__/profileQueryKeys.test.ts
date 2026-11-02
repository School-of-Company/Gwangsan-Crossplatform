import { profileQueryKeys } from '../profileQueryKeys';

describe('profileQueryKeys', () => {
  it('기존 캐시와 같은 키 값을 유지한다', () => {
    expect(profileQueryKeys.myProfile()).toEqual(['myProfile', 'current']);
    expect(profileQueryKeys.myInformation()).toEqual(['myInformation']);
    expect(profileQueryKeys.profile('5')).toEqual(['profile', '5']);
    expect(profileQueryKeys.myPosts()).toEqual(['myPosts', 'current']);
  });

  it('다른 회원 글 키는 내 글 키와 섞이지 않는다', () => {
    expect(profileQueryKeys.memberPosts('5')).toEqual(['memberPosts', '5']);
    expect(profileQueryKeys.memberPosts('5').slice(0, 1)).not.toEqual(profileQueryKeys.myPostsAll);
  });

  it('상세 키는 all 키로 한 번에 무효화할 수 있다', () => {
    expect(profileQueryKeys.profile('5').slice(0, 1)).toEqual(profileQueryKeys.profileAll);
    expect(profileQueryKeys.myPosts().slice(0, 1)).toEqual(profileQueryKeys.myPostsAll);
    expect(profileQueryKeys.memberPosts('5').slice(0, 1)).toEqual(profileQueryKeys.memberPostsAll);
  });
});
