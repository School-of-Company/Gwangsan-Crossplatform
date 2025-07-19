export enum AlertType {
  CHTTING_REQUEST = 'CHTTING_REQUEST',
  NOTICE = 'NOTICE',
  TRADE_COMPLETE = 'TRADE_COMPLETE',
  TRADE_COMPLETE_REJECT = 'TRADE_COMPLETE_REJECT',
  OTHER_MEMBER_TRADE_COMPLETE = 'OTHER_MEMBER_TRADE_COMPLETE',
  RECOMMENDER = 'RECOMMENDER',
  REVIEW = 'REVIEW',
}

export interface Alert {
  id: number;
  title: string;
  content: string;
  alert_type: AlertType;
  imageIds: number[];
  createdAt: string;
}

export interface AlertListResponse {
  alert: Alert[];
}
