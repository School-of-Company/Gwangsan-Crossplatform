import { PostType } from '~/shared/types/postType';

export const postListMock: PostType[] = [
  {
    id: 1,
    type: 'OBJECT',
    mode: 'GIVER',
    title: '아이폰 15 Pro',
    content: '지금이기회야',
    gwangsan: 150,
    imageUrls: [
      {
        imageId: 1,
        imageUrl: 'https://picsum.photos/200/200?random=1'
      }
    ]
  },
  {
    id: 2,
    type: 'OBJECT',
    mode: 'RECEIVER',
    title: '맥북 필요해요',
    content: '나도 IOS 개발 좀 해보자',
    gwangsan: 200,
    imageUrls: []
  },
  {
    id: 3,
    type: 'SERVICE',
    mode: 'GIVER',
    title: 'ㅁㄴㅇㄹㅁㄴㅇㄹㅁㄴㅇㄹ',
    content: 'ㅁㄴㅇㄹㅁㄴㅇㄹㅁㄴㅇㄹㅁㄴㅇㄹㅁㄴㅇㄹㅁㅇㄴㄹ',
    gwangsan: 180,
    imageUrls: [
      {
        imageId: 2,
        imageUrl: 'https://picsum.photos/200/200?random=2'
      }
    ]
  },
  {
    id: 4,
    type: 'SERVICE',
    mode: 'RECEIVER',
    title: '영어 회화 도움 받고 싶어요',
    content: '토익 스피킹 시험 준비 중입니다.',
    gwangsan: 220,
    imageUrls: []
  }
]; 