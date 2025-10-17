export enum AlertType {
  CHTTING_REQUEST = 'CHTTING_REQUEST',
  NOTICE = 'NOTICE',
  TRADE_COMPLETE = 'TRADE_COMPLETE',
  TRADE_COMPLETE_REJECT = 'TRADE_COMPLETE_REJECT',
  OTHER_MEMBER_TRADE_COMPLETE = 'OTHER_MEMBER_TRADE_COMPLETE',
  RECOMMENDER = 'RECOMMENDER',
  REVIEW = 'REVIEW',
}

export interface AlertImage {
  imageId: number;
  imageUrl: string;
}

export interface Alert {
  id?: number;
  title: string;
  content: string;
  alertType: AlertType;
  createdAt: string;
  images: AlertImage[];
  sendMemberId: number;
  sourceId: number;
}

export type AlertListResponse = Alert[];
