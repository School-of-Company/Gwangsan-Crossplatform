import { instance } from '~/shared/lib/axios';
import { ReportType } from '../model/reportType';

interface ReportRequest {
  productId: number;
  reportType: ReportType;
  content: string;
}

export const report = async (data: ReportRequest) => {
  try {
    await instance.post('/report', data);
    return true;
  } catch (error) {
    throw error;
  }
};
