import { AlertType } from '~/entity/notification/model/alertTypes';

export const notificationDataMock = {
  alert: [
    {
      id: 1,
      title: '새 채팅',
      content: 'ㅁㅇㄹㅁㄴㅇㄹ',
      alert_type: AlertType.CHTTING_REQUEST,
      imageIds: [],
      createdAt: '2024-01-15T10:30:00',
    },
    {
      id: 2,
      title: '새 공지',
      content: '신가동ㅁㄴㅁㄹㅁㄴㅇㄹ',
      alert_type: AlertType.NOTICE,
      imageIds: [],
      createdAt: '2024-01-15T09:45:00',
    },
    {
      id: 3,
      title: '거래 완료',
      content: '아이폰 11 개꿀',
      alert_type: AlertType.TRADE_COMPLETE,
      imageIds: [103],
      createdAt: '2024-01-15T08:20:00',
    },
  ],
};
