import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export interface CancelReservationRequest {
  readonly productId: number;
}

export interface CancelReservationResponse {
  readonly message?: string;
}

export const cancelReservation = async (
  data: CancelReservationRequest
): Promise<CancelReservationResponse> => {
  try {
    const response = await instance.delete<CancelReservationResponse>(
      `/post/reservation/${data.productId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
