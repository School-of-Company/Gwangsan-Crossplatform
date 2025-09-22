export const TYPE = {
  OBJECT: 'OBJECT',
  SERVICE: 'SERVICE',
} as const;

export type ProductType = (typeof TYPE)[keyof typeof TYPE];
