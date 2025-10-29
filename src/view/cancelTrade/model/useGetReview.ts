import { useQuery } from '@tanstack/react-query';
import { getReview } from '../api/getReview';
import { ImageType } from '~/shared/types/imageType';

interface ResponseData {
  review_id: number;
  title: string;
  content: string;
  light: number;
  imageUrls: ImageType[];
}
export const useGetReview = (id: string) => {
  return useQuery<ResponseData>({
    queryKey: ['review', id],
    queryFn: () => getReview(id),
    enabled: !!id,
  });
};
