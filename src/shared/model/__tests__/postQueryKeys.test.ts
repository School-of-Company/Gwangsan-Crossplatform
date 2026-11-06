import { QueryClient } from '@tanstack/react-query';
import { postKeys } from '../postQueryKeys';
import { postChangedQueryKeys, invalidatePostChangedQueries } from '../postChangedQueryKeys';
import { profileQueryKeys } from '../profileQueryKeys';
import { sellingPostsQueryKeys } from '../sellingPostsQueryKeys';

describe('postKeys', () => {
  it('목록 키는 all 키로 한 번에 무효화할 수 있다', () => {
    expect(postKeys.list('GIVER', 'OBJECT')).toEqual(['posts', 'GIVER', 'OBJECT']);
    expect(postKeys.list('GIVER', 'OBJECT').slice(0, 1)).toEqual(postKeys.all);
  });

  it('상세 키는 id를 문자열로 맞춰 string·number id가 같은 캐시를 가리킨다', () => {
    expect(postKeys.detail(5)).toEqual(['post', '5']);
    expect(postKeys.detail('5')).toEqual(postKeys.detail(5));
  });

  it('상세 키는 목록 all 키에 포함되지 않는다', () => {
    expect(postKeys.detail(5).slice(0, 1)).not.toEqual(postKeys.all);
  });
});

describe('postChangedQueryKeys', () => {
  it('게시글·판매중·내 글·회원 글 목록을 포함한다', () => {
    expect(postChangedQueryKeys).toEqual([
      postKeys.all,
      sellingPostsQueryKeys.all,
      profileQueryKeys.myPostsAll,
      profileQueryKeys.memberPostsAll,
    ]);
  });

  it('각 목록의 실제 캐시를 무효화한다', () => {
    const queryClient = new QueryClient();
    const cachedKeys = [
      postKeys.list('GIVER', 'OBJECT'),
      sellingPostsQueryKeys.list({ completed: false, size: 20 }),
      profileQueryKeys.myPosts(),
      profileQueryKeys.memberPosts('3'),
    ];
    cachedKeys.forEach((key) => queryClient.setQueryData(key, []));
    queryClient.setQueryData(profileQueryKeys.myProfile(), {});

    invalidatePostChangedQueries(queryClient);

    cachedKeys.forEach((key) => expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true));
    expect(queryClient.getQueryState(profileQueryKeys.myProfile())?.isInvalidated).toBe(false);
    queryClient.clear();
  });
});
