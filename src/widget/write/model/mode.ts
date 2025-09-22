export const MODE = {
  GIVER: 'GIVER',
  RECEIVER: 'RECEIVER',
} as const;

export type ModeType = (typeof MODE)[keyof typeof MODE];
