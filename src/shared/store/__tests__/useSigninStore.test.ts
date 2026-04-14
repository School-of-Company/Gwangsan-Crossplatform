import { useSigninStore } from '../useSigninStore';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

const INITIAL_STEP = 'nickname';

beforeEach(() => {
  useSigninStore.getState().resetStore();
});

describe('초기 상태', () => {
  it('currentStep이 nickname으로 시작한다', () => {
    expect(useSigninStore.getState().currentStep).toBe(INITIAL_STEP);
  });

  it('formData가 빈 값으로 초기화된다', () => {
    const { formData } = useSigninStore.getState();
    expect(formData.nickname).toBe('');
    expect(formData.password).toBe('');
    expect(formData.deviceToken).toBe('');
    expect(formData.deviceId).toBe('');
  });

  it('osType이 플랫폼에 따라 설정된다', () => {
    const { formData } = useSigninStore.getState();
    expect(['IOS', 'ANDROID']).toContain(formData.osType);
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
});

describe('nextStep', () => {
  it('nickname → password로 진행한다', () => {
    useSigninStore.getState().nextStep();
    expect(useSigninStore.getState().currentStep).toBe('password');
  });

  it('마지막 스텝(password)에서 nextStep 호출 시 그대로 유지된다', () => {
    useSigninStore.getState().goToStep('password');
    useSigninStore.getState().nextStep();
    expect(useSigninStore.getState().currentStep).toBe('password');
  });
});

describe('prevStep', () => {
  it('password → nickname으로 돌아간다', () => {
    useSigninStore.getState().goToStep('password');
    useSigninStore.getState().prevStep();
    expect(useSigninStore.getState().currentStep).toBe('nickname');
  });

  it('첫 번째 스텝(nickname)에서 prevStep 호출 시 그대로 유지된다', () => {
    useSigninStore.getState().prevStep();
    expect(useSigninStore.getState().currentStep).toBe('nickname');
  });
});

describe('goToStep', () => {
  it('password로 바로 이동한다', () => {
    useSigninStore.getState().goToStep('password');
    expect(useSigninStore.getState().currentStep).toBe('password');
  });

  it('nickname으로 돌아간다', () => {
    useSigninStore.getState().goToStep('password');
    useSigninStore.getState().goToStep('nickname');
    expect(useSigninStore.getState().currentStep).toBe('nickname');
  });
});

describe('resetStore', () => {
  it('스텝과 폼 데이터를 초기값으로 되돌린다', () => {
    useSigninStore.getState().setField('nickname', 'gildong');
    useSigninStore.getState().goToStep('password');
    useSigninStore.getState().resetStore();

    expect(useSigninStore.getState().currentStep).toBe(INITIAL_STEP);
    expect(useSigninStore.getState().formData.nickname).toBe('');
    expect(useSigninStore.getState().formData.password).toBe('');
  });
});
