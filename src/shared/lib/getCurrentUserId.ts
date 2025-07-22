import { getData } from './getData';
import { instance } from './axios';

let currentUserId: number | null = null;

export const getCurrentUserId = async (): Promise<number> => {
  if (currentUserId === null) {
    try {
      const memberIdString = await getData('memberId');
      if (memberIdString) {
        currentUserId = parseInt(memberIdString, 10);
      } else {
        const response = await instance.get('/member');
        currentUserId = response.data.memberId;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  return currentUserId!;
};

export const clearCurrentUserId = (): void => {
  currentUserId = null;
}; 