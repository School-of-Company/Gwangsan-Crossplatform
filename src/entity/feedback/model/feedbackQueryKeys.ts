export const feedbackQueryKeys = {
  all: ['feedback'] as const,
  myList: () => [...feedbackQueryKeys.all, 'me'] as const,
  detail: (feedbackId: number) => [...feedbackQueryKeys.all, 'detail', feedbackId] as const,
};
