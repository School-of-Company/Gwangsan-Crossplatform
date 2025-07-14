import Toast from 'react-native-toast-message';
import { instance } from '../lib/axios';
import { MODE, TYPE, PostType } from '../types/postType';

export const getPosts = async (type?: TYPE, mode?: MODE): Promise<PostType[]> => {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (mode) params.append('mode', mode);
    const response = await instance.get('/post?' + params.toString());
    
    const transformedData: PostType[] = response.data.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      gwangsan: post.gwangsan,
      type: post.type,
      mode: post.mode,
      imageUrls: post.images || [] 
    }));
    
    return transformedData;
  } catch (error) {
    if (error instanceof Error) {
      Toast.show({
        type: 'error',
        text1: '게시물 불러오기 실패',
        text2: error.message,
      });
    }
    return [];
  }
};
