import { useResetPasswordStore } from '../useResetPasswordStore';

const INITIAL_STEP = 'phoneNumber';

beforeEach(() => {
  useResetPasswordStore.getState().resetStore();
});

describe('초기 상태', () => {
  it('currentStep이 phoneNumber로 시작한다', () => {
    expect(useResetPasswordStore.getState().currentStep).toBe(INITIAL_STEP);
  });

  it('formData가 빈 값으로 초기화된다', () => {
    const { formData } = useResetPasswordStore.getState();
    expect(formData.phoneNumber).toBe('');
    expect(formData.verificationCode).toBe('');
    expect(formData.newPassword).toBe('');
    expect(formData.newPasswordConfirm).toBe('');
  });
});

describe('setField', () => {
  it('phoneNumber 필드를 업데이트한다', () => {
    useResetPasswordStore.getState().setField('phoneNumber', '010-1234-5678');
    expect(useResetPasswordStore.getState().formData.phoneNumber).toBe('010-1234-5678');
  });

  it('verificationCode 필드를 업데이트한다', () => {
    useResetPasswordStore.getState().setField('verificationCode', '123456');
    expect(useResetPasswordStore.getState().formData.verificationCode).toBe('123456');
  });

  it('newPassword 필드를 업데이트한다', () => {
    useResetPasswordStore.getState().setField('newPassword', 'newPass123!');
    expect(useResetPasswordStore.getState().formData.newPassword).toBe('newPass123!');
  });

  it('newPasswordConfirm 필드를 업데이트한다', () => {
    useResetPasswordStore.getState().setField('newPasswordConfirm', 'newPass123!');
    expect(useResetPasswordStore.getState().formData.newPasswordConfirm).toBe('newPass123!');
  });

  it('다른 필드에 영향을 주지 않는다', () => {
    useResetPasswordStore.getState().setField('phoneNumber', '010-1234-5678');
    expect(useResetPasswordStore.getState().formData.verificationCode).toBe('');
    expect(useResetPasswordStore.getState().formData.newPassword).toBe('');
  });

  it('빈 문자열로 필드를 덮어쓸 수 있다', () => {
    useResetPasswordStore.getState().setField('phoneNumber', '010-1234-5678');
    useResetPasswordStore.getState().setField('phoneNumber', '');
    expect(useResetPasswordStore.getState().formData.phoneNumber).toBe('');
  });

  it('특수문자가 포함된 newPassword를 설정할 수 있다', () => {
    useResetPasswordStore.getState().setField('newPassword', 'P@ss!w0rd#$%^&*');
    expect(useResetPasswordStore.getState().formData.newPassword).toBe('P@ss!w0rd#$%^&*');
  });

  it('newPassword와 newPasswordConfirm을 동일하게 설정할 수 있다', () => {
    const pw = 'SamePass123!';
    useResetPasswordStore.getState().setField('newPassword', pw);
    useResetPasswordStore.getState().setField('newPasswordConfirm', pw);

    const { formData } = useResetPasswordStore.getState();
    expect(formData.newPassword).toBe(formData.newPasswordConfirm);
  });
});

describe('nextStep', () => {
  it('phoneNumber → newPassword로 진행한다', () => {
    useResetPasswordStore.getState().nextStep();
    expect(useResetPasswordStore.getState().currentStep).toBe('newPassword');
  });

  it('마지막 스텝(newPassword)에서 nextStep 호출 시 그대로 유지된다', () => {
    useResetPasswordStore.getState().goToStep('newPassword');
    useResetPasswordStore.getState().nextStep();
    expect(useResetPasswordStore.getState().currentStep).toBe('newPassword');
  });
});

describe('prevStep', () => {
  it('newPassword → phoneNumber로 돌아간다', () => {
    useResetPasswordStore.getState().goToStep('newPassword');
    useResetPasswordStore.getState().prevStep();
    expect(useResetPasswordStore.getState().currentStep).toBe('phoneNumber');
  });

  it('첫 번째 스텝(phoneNumber)에서 prevStep 호출 시 그대로 유지된다', () => {
    useResetPasswordStore.getState().prevStep();
    expect(useResetPasswordStore.getState().currentStep).toBe('phoneNumber');
  });
});

describe('goToStep', () => {
  it('newPassword로 바로 이동한다', () => {
    useResetPasswordStore.getState().goToStep('newPassword');
    expect(useResetPasswordStore.getState().currentStep).toBe('newPassword');
  });

  it('phoneNumber로 돌아간다', () => {
    useResetPasswordStore.getState().goToStep('newPassword');
    useResetPasswordStore.getState().goToStep('phoneNumber');
    expect(useResetPasswordStore.getState().currentStep).toBe('phoneNumber');
  });

  it('현재 스텝과 같은 스텝으로 이동해도 상태가 유지된다', () => {
    useResetPasswordStore.getState().setField('phoneNumber', '010-1234-5678');
    useResetPasswordStore.getState().goToStep('phoneNumber');

    expect(useResetPasswordStore.getState().currentStep).toBe('phoneNumber');
    expect(useResetPasswordStore.getState().formData.phoneNumber).toBe('010-1234-5678');
  });
});

describe('resetStore', () => {
  it('스텝과 폼 데이터를 초기값으로 되돌린다', () => {
    useResetPasswordStore.getState().setField('phoneNumber', '010-1234-5678');
    useResetPasswordStore.getState().setField('newPassword', 'newPass123!');
    useResetPasswordStore.getState().goToStep('newPassword');
    useResetPasswordStore.getState().resetStore();

    expect(useResetPasswordStore.getState().currentStep).toBe(INITIAL_STEP);
    expect(useResetPasswordStore.getState().formData.phoneNumber).toBe('');
    expect(useResetPasswordStore.getState().formData.newPassword).toBe('');
  });

  it('모든 필드를 설정한 뒤 resetStore하면 전부 초기화된다', () => {
    useResetPasswordStore.getState().setField('phoneNumber', '010-9999-8888');
    useResetPasswordStore.getState().setField('verificationCode', '654321');
    useResetPasswordStore.getState().setField('newPassword', 'New@Pass1');
    useResetPasswordStore.getState().setField('newPasswordConfirm', 'New@Pass1');
    useResetPasswordStore.getState().resetStore();

    const { formData } = useResetPasswordStore.getState();
    expect(formData.phoneNumber).toBe('');
    expect(formData.verificationCode).toBe('');
    expect(formData.newPassword).toBe('');
    expect(formData.newPasswordConfirm).toBe('');
  });
});
