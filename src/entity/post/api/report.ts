import { instance } from '~/shared/lib/axios';
import { ReportType } from '../model/reportType';

interface BaseReportRequest {
  reportType: ReportType;
  content: string;
  imageIds: number[];
}

interface FraudReportRequest extends BaseReportRequest {
  reportType: 'FRAUD';
  productId: number;
}

interface MemberReportRequest extends BaseReportRequest {
  reportType: 'BAD_LANGUAGE' | 'MEMBER' | 'ETC';
  memberId: number;
}

type ReportRequest = FraudReportRequest | MemberReportRequest;

interface ReportApiPayload {
  sourceId: number;
  reportType: ReportType;
  content: string;
  imageIds: number[];
}

export const report = async (data: ReportRequest): Promise<void> => {
  try {
    const payload: ReportApiPayload = {
      sourceId: data.reportType === 'FRAUD' ? data.productId : data.memberId,
      reportType: data.reportType,
      content: data.content,
      imageIds: data.imageIds,
    };
    
    await instance.post('/report', payload);
  } catch (error) {
    throw error;
  }
};

export type { ReportRequest, FraudReportRequest, MemberReportRequest };
