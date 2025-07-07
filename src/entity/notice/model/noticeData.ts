export interface NoticeImage {
  imageId: number;
  imageUrl: string;
}

export interface NoticeData {
  id: number;
  title: string;
  content: string;
  place: string;
  createdAt: string;
  role: string;
  images: NoticeImage[];
}
