import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export type FeedbackType = 'BUG' | 'SUGGESTION' | 'TRADE' | 'ACCOUNT' | 'ETC';

export interface FeedbackEnvironment {
  appVersion: string | null;
  osType: 'IOS' | 'ANDROID';
  osVersion: string | null;
  deviceModel: string | null;
}

export interface CreateFeedbackRequest extends FeedbackEnvironment {
  type: FeedbackType;
  content: string;
  imageIds: number[];
}

export const createFeedback = async (data: CreateFeedbackRequest): Promise<void> => {
  try {
    await instance.post('/feedback', data);
  } catch (error) {
    throw toAppError(error);
  }
};
