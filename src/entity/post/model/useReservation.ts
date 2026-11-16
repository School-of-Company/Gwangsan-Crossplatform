import { useMutation } from '@tanstack/react-query';
import { makeReservation } from '../api/makeReservation';
import { cancelReservation } from '../api/cancelReservation';

export const useReservation = () => {
  const reserve = useMutation({ mutationFn: makeReservation });
  const cancel = useMutation({ mutationFn: cancelReservation });

  return { reserve: reserve.mutateAsync, cancel: cancel.mutateAsync };
};
