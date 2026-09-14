import { useSignupStore } from '../useSignupStore';

beforeEach(() => {
  useSignupStore.getState().resetStore();
});

describe('초기 상태', () => {
  it('formData가 빈 값으로 초기화된다', () => {
    const { formData } = useSignupStore.getState();
    expect(formData.name).toBe('');
    expect(formData.nickname).toBe('');
    expect(formData.password).toBe('');
    expect(formData.passwordConfirm).toBe('');
    expect(formData.phoneNumber).toBe('');
    expect(formData.verificationCode).toBe('');
    expect(formData.dongName).toBe('');
    expect(formData.placeId).toBe(0);
    expect(formData.specialties).toEqual([]);
    expect(formData.description).toBe('');
    expect(formData.recommender).toBe('');
  });
});

describe('setField', () => {
  it('문자열 필드를 업데이트한다', () => {
    useSignupStore.getState().setField('name', '홍길동');
    expect(useSignupStore.getState().formData.name).toBe('홍길동');
  });

  it('nickname을 업데이트한다', () => {
    useSignupStore.getState().setField('nickname', 'gildong');
    expect(useSignupStore.getState().formData.nickname).toBe('gildong');
  });

  it('placeId(숫자)를 업데이트한다', () => {
    useSignupStore.getState().setField('placeId', 42);
    expect(useSignupStore.getState().formData.placeId).toBe(42);
  });

  it('placeId를 0으로 설정할 수 있다', () => {
    useSignupStore.getState().setField('placeId', 42);
    useSignupStore.getState().setField('placeId', 0);
    expect(useSignupStore.getState().formData.placeId).toBe(0);
  });

  it('specialties(배열)를 업데이트한다', () => {
    useSignupStore.getState().setField('specialties', ['요리', '운동']);
    expect(useSignupStore.getState().formData.specialties).toEqual(['요리', '운동']);
  });

  it('specialties를 빈 배열로 덮어쓸 수 있다', () => {
    useSignupStore.getState().setField('specialties', ['요리', '운동']);
    useSignupStore.getState().setField('specialties', []);
    expect(useSignupStore.getState().formData.specialties).toEqual([]);
  });

  it('specialties를 여러 항목으로 교체할 수 있다', () => {
    useSignupStore.getState().setField('specialties', ['요리']);
    useSignupStore.getState().setField('specialties', ['운동', '음악', '독서']);
    expect(useSignupStore.getState().formData.specialties).toEqual(['운동', '음악', '독서']);
  });

  it('다른 필드에 영향을 주지 않는다', () => {
    useSignupStore.getState().setField('name', '홍길동');
    expect(useSignupStore.getState().formData.nickname).toBe('');
    expect(useSignupStore.getState().formData.password).toBe('');
  });

  it('빈 문자열로 필드를 초기화할 수 있다', () => {
    useSignupStore.getState().setField('name', '홍길동');
    useSignupStore.getState().setField('name', '');
    expect(useSignupStore.getState().formData.name).toBe('');
  });
});

describe('resetStore', () => {
  it('폼 데이터를 초기값으로 되돌린다', () => {
    useSignupStore.getState().setField('name', '홍길동');
    useSignupStore.getState().resetStore();

    expect(useSignupStore.getState().formData.name).toBe('');
  });

  it('specialties 배열이 빈 배열로 초기화된다', () => {
    useSignupStore.getState().setField('specialties', ['요리', '운동', '음악']);
    useSignupStore.getState().resetStore();

    expect(useSignupStore.getState().formData.specialties).toEqual([]);
  });

  it('placeId가 0으로 초기화된다', () => {
    useSignupStore.getState().setField('placeId', 99);
    useSignupStore.getState().resetStore();

    expect(useSignupStore.getState().formData.placeId).toBe(0);
  });

  it('모든 문자열 필드가 빈 문자열로 초기화된다', () => {
    useSignupStore.getState().setField('name', '홍길동');
    useSignupStore.getState().setField('nickname', 'gildong');
    useSignupStore.getState().setField('password', 'pass123');
    useSignupStore.getState().setField('passwordConfirm', 'pass123');
    useSignupStore.getState().setField('phoneNumber', '010-1234-5678');
    useSignupStore.getState().setField('verificationCode', '123456');
    useSignupStore.getState().setField('dongName', '광산동');
    useSignupStore.getState().setField('description', '자기소개');
    useSignupStore.getState().setField('recommender', '추천인');
    useSignupStore.getState().resetStore();

    const { formData } = useSignupStore.getState();
    expect(formData.name).toBe('');
    expect(formData.nickname).toBe('');
    expect(formData.password).toBe('');
    expect(formData.passwordConfirm).toBe('');
    expect(formData.phoneNumber).toBe('');
    expect(formData.verificationCode).toBe('');
    expect(formData.dongName).toBe('');
    expect(formData.description).toBe('');
    expect(formData.recommender).toBe('');
  });
});
