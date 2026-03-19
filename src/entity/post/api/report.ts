import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export type ReportReason =
  | 'SEXUAL'
  | 'ABUSE_HATE_HARASSMENT'
  | 'SPAM_AD'
  | 'IMPERSONATION'
  | 'SELF_HARM_DANGER'
  | 'ETC';

export type ReportTargetType = 'PRODUCT' | 'MEMBER';

interface BaseReportRequest {
  targetType: ReportTargetType;
  reason: ReportReason;
  content: string;
  imageIds: number[];
}

interface ProductReportRequest extends BaseReportRequest {
  targetType: 'PRODUCT';
  productId: number;
  memberId: number;
}

interface MemberReportRequest extends BaseReportRequest {
  targetType: 'MEMBER';
  memberId: number;
}

export type ReportRequest = ProductReportRequest | MemberReportRequest;

interface ReportApiPayload {
  sourceId: number;
  reportType: ReportReason;
  content: string;
  imageIds: number[];
}

export const report = async (data: ReportRequest): Promise<void> => {
  try {
    const payload: ReportApiPayload = {
      sourceId: data.memberId,
      reportType: data.reason,
      content: data.content,
      imageIds: data.imageIds,
    };

    await instance.post('/report', payload);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
