import { NoticeData } from '@/entity/notice/model/noticeData';
import { PLACE } from '@/shared/consts/place';

export const noticeListMock: NoticeData[] = [
  {
    id: 1,
    title: "지점명 공지입니다",
    content: "당분간 거래증지입니다.\n\n어떤 이의 거래 증지 의사로인해 요청사항이 있어서 공지드립니다.\n\n자세한 내용은 지점으로 문의해주시기 바랍니다.",
    place: PLACE[0],
    createdAt: "2025-01-15",
    role: "ROLE_PLACE_ADMIN",
    images: []
  },
  {
    id: 2,
    title: "시스템 점검 안내",
    content: "서비스 개선을 위한 시스템 점검이 예정되어 있습니다.\n\n점검 일시: 2024년 1월 20일 오전 2시 - 6시\n점검 내용: 서버 업그레이드 및 성능 개선\n\n점검 시간 동안 서비스 이용이 불가능할 수 있습니다.",
    place: PLACE[1],
    createdAt: "2025-01-14",
    role: "ROLE_PLACE_ADMIN",
    images: [
      {
        imageId: 1,
        imageUrl: "https://m.kukinews.com/data/kuk/image/2024/03/15/kuk202403150245.jpg"
      }
    ]
  },
  {
    id: 3,
    title: "영업시간 변경 안내",
    content: "임시 영업시간 변경에 대한 안내드립니다.\n\n변경 기간: 2024년 1월 22일 - 1월 26일\n변경 시간: 오전 10시 - 오후 5시\n\n이용에 불편을 드려 죄송합니다.",
    place: PLACE[2],
    createdAt: "2025-01-13",
    role: "ROLE_PLACE_ADMIN",
    images: []
  },
  {
    id: 4,
    title: "신규 서비스 출시 안내",
    content: "새로운 모바일 서비스가 출시되었습니다.\n\n주요 기능:\n- 실시간 알림\n- 거래 내역 조회\n- 온라인 예약\n\n많은 이용 부탁드립니다.",
    place: PLACE[3],
    createdAt: "2025-01-12",
    role: "ROLE_PLACE_ADMIN",
    images: [
      {
        imageId: 1,
        imageUrl: "https://krauser085.github.io/assets/img/docker.png"
      },
    ]
  }
];
