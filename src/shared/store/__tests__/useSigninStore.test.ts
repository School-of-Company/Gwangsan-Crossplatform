import { useSigninStore } from '../useSigninStore';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

beforeEach(() => {
  useSigninStore.getState().resetStore();
});

describe('초기 상태', () => {
  it('formData가 빈 값으로 초기화된다', () => {
    const { formData } = useSigninStore.getState();
    expect(formData.nickname).toBe('');
    expect(formData.password).toBe('');
    expect(formData.deviceToken).toBe('');
    expect(formData.deviceId).toBe('');
  });

  it('osType이 플랫폼에 따라 설정된다', () => {
    const { formData } = useSigninStore.getState();
    expect(formData.osType).toBe('IOS');
  });
});

describe('setField', () => {
  it('nickname 필드를 업데이트한다', () => {
    useSigninStore.getState().setField('nickname', 'gildong');
    expect(useSigninStore.getState().formData.nickname).toBe('gildong');
  });

  it('password 필드를 업데이트한다', () => {
    useSigninStore.getState().setField('password', 'secret123');
    expect(useSigninStore.getState().formData.password).toBe('secret123');
  });

  it('deviceToken을 업데이트한다', () => {
    useSigninStore.getState().setField('deviceToken', 'abc-token');
    expect(useSigninStore.getState().formData.deviceToken).toBe('abc-token');
  });

  it('다른 필드에 영향을 주지 않는다', () => {
    useSigninStore.getState().setField('nickname', 'gildong');
    expect(useSigninStore.getState().formData.password).toBe('');
  });

  it('빈 문자열로 필드를 초기화할 수 있다', () => {
    useSigninStore.getState().setField('nickname', 'gildong');
    useSigninStore.getState().setField('nickname', '');
    expect(useSigninStore.getState().formData.nickname).toBe('');
  });

  it('특수문자가 포함된 password를 설정할 수 있다', () => {
    useSigninStore.getState().setField('password', 'P@ss!w0rd#$%');
    expect(useSigninStore.getState().formData.password).toBe('P@ss!w0rd#$%');
  });

  it('여러 필드를 순서대로 업데이트해도 각각 독립적으로 반영된다', () => {
    useSigninStore.getState().setField('nickname', 'gildong');
    useSigninStore.getState().setField('password', 'pass123');
    useSigninStore.getState().setField('deviceToken', 'tok-abc');

    const { formData } = useSigninStore.getState();
    expect(formData.nickname).toBe('gildong');
    expect(formData.password).toBe('pass123');
    expect(formData.deviceToken).toBe('tok-abc');
  });
});

describe('resetStore', () => {
  it('폼 데이터를 초기값으로 되돌린다', () => {
    useSigninStore.getState().setField('nickname', 'gildong');
    useSigninStore.getState().resetStore();

    expect(useSigninStore.getState().formData.nickname).toBe('');
    expect(useSigninStore.getState().formData.password).toBe('');
  });

  it('resetStore 후 osType이 IOS로 유지된다', () => {
    useSigninStore.getState().resetStore();
    expect(useSigninStore.getState().formData.osType).toBe('IOS');
  });

  it('모든 필드를 설정한 뒤 resetStore하면 전부 초기화된다', () => {
    useSigninStore.getState().setField('nickname', 'gildong');
    useSigninStore.getState().setField('password', 'pass123');
    useSigninStore.getState().setField('deviceToken', 'tok');
    useSigninStore.getState().setField('deviceId', 'dev-id');
    useSigninStore.getState().resetStore();

    const { formData } = useSigninStore.getState();
    expect(formData.nickname).toBe('');
    expect(formData.password).toBe('');
    expect(formData.deviceToken).toBe('');
    expect(formData.deviceId).toBe('');
  });
});
