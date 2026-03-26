import { itemFormSchema, createItemFormRequestBody } from '../itemFormSchema';

describe('itemFormSchema', () => {
  const validData = {
    type: 'OBJECT',
    mode: 'GIVER',
    title: '제목',
    content: '내용',
    gwangsan: 1,
  };

  it('유효한 데이터는 통과한다', () => {
    expect(itemFormSchema.safeParse(validData).success).toBe(true);
  });

  it('imageIds를 포함한 유효한 데이터는 통과한다', () => {
    expect(itemFormSchema.safeParse({ ...validData, imageIds: [1, 2, 3] }).success).toBe(true);
  });

  it('imageIds가 빈 배열이어도 통과한다', () => {
    expect(itemFormSchema.safeParse({ ...validData, imageIds: [] }).success).toBe(true);
  });

  it('imageIds가 없어도 통과한다', () => {
    const { imageIds: _, ...dataWithoutImageIds } = { ...validData, imageIds: undefined };
    expect(itemFormSchema.safeParse(dataWithoutImageIds).success).toBe(true);
  });

  it('title이 빈 문자열이면 실패한다', () => {
    const result = itemFormSchema.safeParse({ ...validData, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('제목을 입력해주세요');
  });

  it('content가 빈 문자열이면 실패한다', () => {
    const result = itemFormSchema.safeParse({ ...validData, content: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('내용을 입력해주세요');
  });

  it('gwangsan이 0이면 실패한다', () => {
    const result = itemFormSchema.safeParse({ ...validData, gwangsan: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('광산을 입력해주세요');
  });

  it('gwangsan이 음수이면 실패한다', () => {
    const result = itemFormSchema.safeParse({ ...validData, gwangsan: -1 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('광산을 입력해주세요');
  });

  it('type은 빈 문자열이어도 통과한다', () => {
    expect(itemFormSchema.safeParse({ ...validData, type: '' }).success).toBe(true);
  });

  it('mode는 빈 문자열이어도 통과한다', () => {
    expect(itemFormSchema.safeParse({ ...validData, mode: '' }).success).toBe(true);
  });
});

describe('createItemFormRequestBody', () => {
  const baseInput = {
    type: 'OBJECT',
    mode: 'GIVER',
    title: '제목',
    content: '내용',
    gwangsan: '1',
    images: [],
  };

  it('gwangsan 문자열을 숫자로 변환한다', () => {
    const result = createItemFormRequestBody(baseInput);
    expect(result.gwangsan).toBe(1);
  });

  it('gwangsan이 소수점 문자열이면 정수로 내림한다', () => {
    const result = createItemFormRequestBody({ ...baseInput, gwangsan: '10.9' });
    expect(result.gwangsan).toBe(10);
  });

  it('gwangsan이 "0"이면 0을 반환한다', () => {
    const result = createItemFormRequestBody({ ...baseInput, gwangsan: '0' });
    expect(result.gwangsan).toBe(0);
  });

  it('gwangsan이 숫자가 아닌 문자열이면 NaN을 반환한다', () => {
    const result = createItemFormRequestBody({ ...baseInput, gwangsan: 'abc' });
    expect(result.gwangsan).toBeNaN();
  });

  it('imageIds가 undefined이면 반환값에서 imageIds가 undefined이다', () => {
    const result = createItemFormRequestBody({ ...baseInput, imageIds: undefined });
    expect(result.imageIds).toBeUndefined();
  });

  it('imageIds가 빈 배열이면 undefined를 반환한다', () => {
    const result = createItemFormRequestBody({ ...baseInput, imageIds: [] });
    expect(result.imageIds).toBeUndefined();
  });

  it('imageIds가 있으면 그대로 반환한다', () => {
    const result = createItemFormRequestBody({ ...baseInput, imageIds: [1, 2, 3] });
    expect(result.imageIds).toEqual([1, 2, 3]);
  });

  it('type과 mode를 그대로 반환한다', () => {
    const result = createItemFormRequestBody(baseInput);
    expect(result.type).toBe('OBJECT');
    expect(result.mode).toBe('GIVER');
  });

  it('title과 content를 그대로 반환한다', () => {
    const result = createItemFormRequestBody(baseInput);
    expect(result.title).toBe('제목');
    expect(result.content).toBe('내용');
  });
});
