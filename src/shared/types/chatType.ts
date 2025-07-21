import { ImageType } from './imageType';

export type ChatImage = ImageType;

export interface ChatMember {
  readonly memberId: number;
  readonly nickname: string;
}

export const MESSAGE_TYPE = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export type RoomId = number & { readonly __brand: 'RoomId' };
export type MessageId = number & { readonly __brand: 'MessageId' };
export type ProductId = number & { readonly __brand: 'ProductId' };

export type ChatTimestamp = string;
export type OptionalContent = string | null;
