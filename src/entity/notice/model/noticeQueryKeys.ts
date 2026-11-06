export const noticeKeys = {
  list: () => ['noticeList'] as const,
  detail: (id: number | undefined) => ['noticeDetail', id] as const,
} as const;
