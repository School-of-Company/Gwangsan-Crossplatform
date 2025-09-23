import { instance } from '~/shared/lib/axios';

export interface MakeReservationRequest {
  readonly productId: number;
}

export interface MakeReservationResponse {
  readonly message?: string;
}

export const makeReservation = async (
  data: MakeReservationRequest
): Promise<MakeReservationResponse> => {
  try {
    const response = await instance.patch<MakeReservationResponse>(
      `/post/reservation/${data.productId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
