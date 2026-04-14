import { instance } from '~/shared/lib/axios';
import { getMyProfile } from '../getMyProfile';
import { getProfile } from '../getProfile';
import { getMyPosts } from '../getMyPosts';
import { getPost } from '../getPosts';
import { updateProfile } from '../updateProfile';
import { blockUser, unblockUser } from '../blockUser';
import { getBlockList } from '../getBlockList';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = instance.get as jest.Mock;
const mockPost = instance.post as jest.Mock;
const mockPatch = instance.patch as jest.Mock;
const mockDelete = instance.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getMyProfile', () => {
  it('GET /member 응답 data를 반환한다', async () => {
    mockGet.mockResolvedValue({ data: { memberId: 1, nickname: '광산인' } });

    const result = await getMyProfile();

    expect(mockGet).toHaveBeenCalledWith('/member');
    expect(result).toEqual({ memberId: 1, nickname: '광산인' });
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(getMyProfile()).rejects.toThrow('Network error');
  });
});

describe('getProfile', () => {
  it('GET /member/:id 응답 data를 반환한다', async () => {
    mockGet.mockResolvedValue({ data: { memberId: 42, nickname: '상대방' } });

    const result = await getProfile('42');

    expect(mockGet).toHaveBeenCalledWith('/member/42');
    expect(result).toEqual({ memberId: 42, nickname: '상대방' });
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));

    await expect(getProfile('99')).rejects.toThrow('Not found');
  });
});

describe('getMyPosts', () => {
  it('GET /post/current 응답 data를 반환한다', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 1, title: '내 게시글' }] });

    const result = await getMyPosts();

    expect(mockGet).toHaveBeenCalledWith('/post/current');
    expect(result).toEqual([{ id: 1, title: '내 게시글' }]);
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Unauthorized'));

    await expect(getMyPosts()).rejects.toThrow('Unauthorized');
  });
});

describe('getPost', () => {
  it('GET /post/member/:id 응답 data를 반환한다', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 2, title: '상대방 게시글' }] });

    const result = await getPost('5');

    expect(mockGet).toHaveBeenCalledWith('/post/member/5');
    expect(result).toEqual([{ id: 2, title: '상대방 게시글' }]);
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));

    await expect(getPost('999')).rejects.toThrow('Not found');
  });
});

describe('updateProfile', () => {
  const payload = { nickname: '새닉네임', specialties: ['요리'], description: '소개' };

  it('PATCH /member로 프로필을 수정하고 data를 반환한다', async () => {
    mockPatch.mockResolvedValue({ data: { success: true } });

    const result = await updateProfile(payload);

    expect(mockPatch).toHaveBeenCalledWith('/member', payload);
    expect(result).toEqual({ success: true });
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockPatch.mockRejectedValue(new Error('Validation error'));

    await expect(updateProfile(payload)).rejects.toThrow('Validation error');
  });
});

describe('blockUser / unblockUser', () => {
  it('blockUser — POST /block/:id 응답 data를 반환한다', async () => {
    mockPost.mockResolvedValue({ data: { blocked: true } });

    const result = await blockUser(7);

    expect(mockPost).toHaveBeenCalledWith('/block/7');
    expect(result).toEqual({ blocked: true });
  });

  it('unblockUser — DELETE /block/:id 응답 data를 반환한다', async () => {
    mockDelete.mockResolvedValue({ data: { unblocked: true } });

    const result = await unblockUser(7);

    expect(mockDelete).toHaveBeenCalledWith('/block/7');
    expect(result).toEqual({ unblocked: true });
  });
});

describe('getBlockList', () => {
  it('GET /block 응답 data를 반환한다', async () => {
    const list = [{ memberId: 3, nickname: '차단된유저' }];
    mockGet.mockResolvedValue({ data: list });

    const result = await getBlockList();

    expect(mockGet).toHaveBeenCalledWith('/block');
    expect(result).toEqual(list);
  });
});
