export const TYPE = {
  OBJECT: '물건',
  SERVICE: '서비스',
} as const;

export type ProductType = (typeof TYPE)[keyof typeof TYPE];
