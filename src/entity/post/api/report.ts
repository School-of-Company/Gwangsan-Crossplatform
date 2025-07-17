import { instance } from '~/shared/lib/axios';
import { ReportType } from '../model/reportType';

interface ReportRequest {
  sourceId: number;
  reportType: ReportType;
  content: string;
  imageIds: number[];
}

export const report = async (data: ReportRequest): Promise<void> => {
  try {
    await instance.post('/report', data);
  } catch (error) {
    throw error;
  }
};
