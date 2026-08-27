import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface MakeReservationRequest {
  readonly productId: number;
  readonly roomId: number;
  readonly scheduledAt: string;
  readonly placeName: string;
  readonly address: string;
  readonly latitude: number;
  readonly longitude: number;
}

export const makeReservation = async ({
  productId,
  ...body
}: MakeReservationRequest): Promise<void> => {
  try {
    await instance.patch(`/post/reservation/${productId}`, body);
  } catch (error) {
    throw toAppError(error);
  }
};
