import { getPostThumbnail } from '../getPostThumbnail';

const img = (imageUrl: string) => ({ imageId: 1, imageUrl });

describe('getPostThumbnail', () => {
  it('imageUrls를 images보다 우선한다', () => {
    expect(getPostThumbnail({ imageUrls: [img('a')], images: [img('b')] })).toBe('a');
  });
  it('imageUrls가 비면 images의 첫 이미지를 쓴다', () => {
    expect(getPostThumbnail({ imageUrls: [], images: [img('b')] })).toBe('b');
  });
  it('이미지가 없으면 null', () => {
    expect(getPostThumbnail({})).toBeNull();
  });
});
