import { instance } from '~/shared/lib/axios';
import { AlertListResponse } from '../model/alertTypes';

export const getAlertList = async (): Promise<AlertListResponse> => {
  const { data } = await instance.get<AlertListResponse>('/alert');
  return data;
};
