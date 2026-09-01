import { useMemo } from 'react';
import { useChatRoomData } from '~/entity/chat/model/useChatRoomData';
import { useGetItem } from '~/entity/post/model/useGetItem';
import { MODE } from '~/widget/write/model/mode';
import type { RoomId } from '~/shared/types/chatType';

interface UseChatUIStateParams {
  readonly roomId: RoomId;
  readonly otherUserInfo: { nickname: string; id?: number };
  readonly hasTradeRequest: boolean;
  readonly shouldShowButtons: boolean;
  readonly onOpenReservationModal: () => void;
  readonly onOpenMap: () => void;
}

interface UseChatUIStateReturn {
  readonly tradeEmbedConfig: {
    readonly shouldShow: boolean;
    readonly product: any;
    readonly showButtons: boolean;
    readonly otherPartyNickname: string;
    readonly onOpenReservationModal?: () => void;
    readonly onOpenMap?: () => void;
  };
  readonly menuConfig: {
    readonly shouldShowMenuButton: boolean;
    readonly isProductLoading: boolean;
    readonly isGiverMode: boolean;
  };
  readonly tradeRequestInfo: {
    readonly productId?: number;
    readonly sellerId?: number;
  };
  readonly componentState: {
    readonly hasMessages: boolean;
    readonly canSendMessage: boolean;
    readonly headerTitle: string;
  };
  readonly productInfoConfig: {
    readonly shouldShow: boolean;
    readonly title: string;
    readonly gwangsan?: number;
    readonly imageUrl?: string;
  };
}

export const useChatUIState = ({
  roomId,
  otherUserInfo,
  hasTradeRequest,
  shouldShowButtons,
  onOpenReservationModal,
  onOpenMap,
}: UseChatUIStateParams): UseChatUIStateReturn => {
  const { data: roomData } = useChatRoomData({ roomId });

  const productId = roomData?.product?.id?.toString();
  const { data: productDetail, isLoading: isProductLoading } = useGetItem(productId);

  const isGiverMode = productDetail?.mode === MODE.GIVER;
  const isReceiverMode = productDetail?.mode === MODE.RECEIVER;
  const shouldShowMenuButton = !isProductLoading && (isGiverMode || isReceiverMode);

  const hasReservationLocation =
    roomData?.product?.reservationLatitude != null &&
    roomData?.product?.reservationLongitude != null;

  const tradeEmbedConfig = useMemo(
    () => ({
      shouldShow: hasTradeRequest,
      product: roomData?.product,
      showButtons: shouldShowButtons,
      otherPartyNickname: otherUserInfo.nickname,
      onOpenReservationModal: shouldShowButtons ? onOpenReservationModal : undefined,
      onOpenMap: hasReservationLocation ? onOpenMap : undefined,
    }),
    [
      hasTradeRequest,
      roomData?.product,
      shouldShowButtons,
      otherUserInfo.nickname,
      onOpenReservationModal,
      hasReservationLocation,
      onOpenMap,
    ]
  );

  const menuConfig = useMemo(
    () => ({
      shouldShowMenuButton,
      isProductLoading,
      isGiverMode,
    }),
    [shouldShowMenuButton, isProductLoading, isGiverMode]
  );

  const tradeRequestInfo = useMemo(
    () => ({
      productId: roomData?.product?.id,
      sellerId: otherUserInfo.id,
    }),
    [roomData?.product?.id, otherUserInfo.id]
  );

  const componentState = useMemo(
    () => ({
      hasMessages: false,
      canSendMessage: false,
      headerTitle: otherUserInfo.nickname,
    }),
    [otherUserInfo.nickname]
  );

  const productInfoConfig = useMemo(
    () => ({
      shouldShow: Boolean(roomData?.product),
      title: productDetail?.title ?? roomData?.product?.title ?? '',
      gwangsan: productDetail?.gwangsan,
      imageUrl: productDetail?.images?.[0]?.imageUrl ?? roomData?.product?.images?.[0]?.imageUrl,
    }),
    [roomData?.product, productDetail]
  );

  return {
    tradeEmbedConfig,
    menuConfig,
    tradeRequestInfo,
    componentState,
    productInfoConfig,
  };
};
