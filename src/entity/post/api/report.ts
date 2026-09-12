import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export type ReportReason =
  'SEXUAL' | 'ABUSE_HATE_HARASSMENT' | 'SPAM_AD' | 'IMPERSONATION' | 'SELF_HARM_DANGER' | 'ETC';

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
  targetType: ReportTargetType;
  reportType: ReportReason;
  content: string;
  imageIds: number[];
}

export const report = async (data: ReportRequest): Promise<void> => {
  try {
    // sourceId 하나만으로는 상품 ID와 회원 ID를 서버가 구분할 수 없어(#624),
    // targetType을 함께 보내 서버가 어떤 테이블에서 조회할지 분기할 수 있게 한다.
    const payload: ReportApiPayload = {
      sourceId: data.targetType === 'PRODUCT' ? data.productId : data.memberId,
      targetType: data.targetType,
      reportType: data.reason,
      content: data.content,
      imageIds: data.imageIds,
    };

    await instance.post('/report', payload);
  } catch (error) {
    throw toAppError(error);
  }
};
