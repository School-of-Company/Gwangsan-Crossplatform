import {
  nameSchema,
  nicknameSchema,
  passwordSchema,
  passwordConfirmSchema,
  phoneSchema,
  verificationCodeSchema,
  descriptionSchema,
  specialtiesSchema,
  profileEditSchema,
} from '../authSchema';

describe('nameSchema', () => {
  it.each(['홍길동', 'John', '홍1길동', '홍 길동', '홍(길동)', '홍~길동', 'A'])(
    '유효한 입력: %s',
    (input) => {
      expect(nameSchema.safeParse(input).success).toBe(true);
    }
  );

  it('앞뒤 공백은 trim 후 통과한다', () => {
    expect(nameSchema.safeParse('  홍길동  ').success).toBe(true);
  });

  it('빈 문자열은 실패한다', () => {
    const result = nameSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('이름을 입력해주세요');
  });

  it('공백만 있으면 trim 후 실패한다', () => {
    const result = nameSchema.safeParse('   ');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('이름을 입력해주세요');
  });

  it.each(['홍@길동', '홍길동!', '#홍길동', '홍-길동', 'hello world$'])(
    '허용되지 않는 특수문자 포함 시 실패: %s',
    (input) => {
      const result = nameSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toBe('한글, 영문, 숫자만 입력 가능합니다');
    }
  );
});

describe('nicknameSchema', () => {
  it.each(['홍길동', 'Nick', '닉네임1', '닉 네임', '닉(네임)', '닉~임'])(
    '유효한 입력: %s',
    (input) => {
      expect(nicknameSchema.safeParse(input).success).toBe(true);
    }
  );

  it('빈 문자열은 실패한다', () => {
    const result = nicknameSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('별칭을 입력해주세요');
  });

  it('공백만 있으면 trim 후 실패한다', () => {
    const result = nicknameSchema.safeParse('   ');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('별칭을 입력해주세요');
  });

  it.each(['닉@네임', '닉네임!', '#닉네임', '닉-네임'])(
    '허용되지 않는 특수문자 포함 시 실패: %s',
    (input) => {
      const result = nicknameSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toBe('한글, 영문, 숫자만 입력 가능합니다');
    }
  );
});

describe('passwordSchema', () => {
  it.each(['abcdefgh', 'ABCDEFGH', '12345678', '!@#$%^&*', 'Abcd1234!', 'pass1234'])(
    '유효한 입력: %s',
    (input) => {
      expect(passwordSchema.safeParse(input).success).toBe(true);
    }
  );

  it('앞뒤 공백을 제거한 뒤 8자 이상이면 통과한다', () => {
    expect(passwordSchema.safeParse('  abcdefgh  ').success).toBe(true);
  });

  it('7자는 실패한다', () => {
    const result = passwordSchema.safeParse('abcdefg');
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('비밀번호는 8자 이상이어야 합니다');
  });

  it('trim 후 7자이면 실패한다', () => {
    const result = passwordSchema.safeParse('  abcde  ');
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('비밀번호는 8자 이상이어야 합니다');
  });

  it.each(['한글비밀번호12', 'pass word1', 'pass\tword1'])(
    '허용되지 않는 문자 포함 시 실패: %s',
    (input) => {
      const result = passwordSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toBe('영문 대소문자, 숫자, 특수문자만 허용됩니다');
    }
  );
});

describe('passwordConfirmSchema', () => {
  it('비밀번호와 일치하면 통과한다', () => {
    expect(passwordConfirmSchema('myPassword1!').safeParse('myPassword1!').success).toBe(true);
  });

  it('비밀번호와 일치하지 않으면 실패한다', () => {
    const result = passwordConfirmSchema('myPassword1!').safeParse('different');
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('비밀번호가 일치하지 않습니다');
  });

  it('기준 비밀번호가 빈 문자열이면 빈 문자열 확인값은 통과한다', () => {
    expect(passwordConfirmSchema('').safeParse('').success).toBe(true);
  });

  it('기준 비밀번호가 빈 문자열인데 다른 값이면 실패한다', () => {
    const result = passwordConfirmSchema('').safeParse('abc');
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('비밀번호가 일치하지 않습니다');
  });

  it('앞뒤 공백은 trim 후 비밀번호와 비교한다', () => {
    expect(passwordConfirmSchema('myPassword1!').safeParse('  myPassword1!  ').success).toBe(true);
  });
});

describe('phoneSchema', () => {
  it('11자리 숫자는 통과한다', () => {
    expect(phoneSchema.safeParse('01012345678').success).toBe(true);
  });

  it('앞뒤 공백을 제거한 뒤 11자리 숫자면 통과한다', () => {
    expect(phoneSchema.safeParse('  01012345678  ').success).toBe(true);
  });

  it('10자리는 실패한다', () => {
    const result = phoneSchema.safeParse('0101234567');
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('전화번호는 11자리여야 합니다');
  });

  it('12자리는 실패한다', () => {
    const result = phoneSchema.safeParse('010123456789');
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('전화번호는 11자리여야 합니다');
  });

  it.each(['0101234567a', '0101234-678', '0101 234567'])(
    '숫자가 아닌 문자 포함 시 실패: %s',
    (input) => {
      const result = phoneSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toBe('숫자만 입력 가능합니다');
    }
  );
});

describe('verificationCodeSchema', () => {
  it.each(['1', '123456', '000000'])('유효한 입력: %s', (input) => {
    expect(verificationCodeSchema.safeParse(input).success).toBe(true);
  });

  it('앞뒤 공백을 제거한 숫자는 통과한다', () => {
    expect(verificationCodeSchema.safeParse('  123456  ').success).toBe(true);
  });

  it('빈 문자열은 실패한다', () => {
    const result = verificationCodeSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('인증번호를 입력해주세요');
  });

  it('공백만 있으면 trim 후 실패한다', () => {
    const result = verificationCodeSchema.safeParse('   ');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('인증번호를 입력해주세요');
  });

  it.each(['12a456', '12 345', '12-345'])('숫자가 아닌 문자 포함 시 실패: %s', (input) => {
    const result = verificationCodeSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('숫자만 입력 가능합니다');
  });
});

describe('descriptionSchema', () => {
  it('1자는 통과한다', () => {
    expect(descriptionSchema.safeParse('a').success).toBe(true);
  });

  it('255자는 통과한다', () => {
    expect(descriptionSchema.safeParse('a'.repeat(255)).success).toBe(true);
  });

  it('빈 문자열은 실패한다', () => {
    const result = descriptionSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('자기소개는 최소 1자 이상 작성해주세요');
  });

  it('공백만 있으면 trim 후 실패한다', () => {
    const result = descriptionSchema.safeParse('   ');
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('자기소개는 최소 1자 이상 작성해주세요');
  });

  it('256자는 실패한다', () => {
    const result = descriptionSchema.safeParse('a'.repeat(256));
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('자기소개는 255자 이하로 작성해주세요');
  });

  it('앞뒤 공백 포함 256자는 trim 후 254자로 통과한다', () => {
    expect(descriptionSchema.safeParse(' ' + 'a'.repeat(254) + ' ').success).toBe(true);
  });
});

describe('specialtiesSchema', () => {
  it('1개는 통과한다', () => {
    expect(specialtiesSchema.safeParse(['특기1']).success).toBe(true);
  });

  it('10개는 통과한다', () => {
    expect(
      specialtiesSchema.safeParse(Array.from({ length: 10 }, (_, i) => `특기${i + 1}`)).success
    ).toBe(true);
  });

  it('빈 배열은 실패한다', () => {
    const result = specialtiesSchema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('특기를 최소 1개 이상 선택해주세요');
  });

  it('11개는 실패한다', () => {
    const result = specialtiesSchema.safeParse(
      Array.from({ length: 11 }, (_, i) => `특기${i + 1}`)
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe('특기는 최대 10개까지 선택 가능합니다');
  });
});

describe('profileEditSchema', () => {
  const validData = {
    nickname: '홍길동',
    specialties: ['특기1'],
    description: '자기소개입니다',
  };

  it('유효한 데이터는 통과한다', () => {
    expect(profileEditSchema.safeParse(validData).success).toBe(true);
  });

  it('nickname이 빈 문자열이면 실패한다', () => {
    expect(profileEditSchema.safeParse({ ...validData, nickname: '' }).success).toBe(false);
  });

  it('specialties가 빈 배열이면 실패한다', () => {
    expect(profileEditSchema.safeParse({ ...validData, specialties: [] }).success).toBe(false);
  });

  it('description이 빈 문자열이면 실패한다', () => {
    expect(profileEditSchema.safeParse({ ...validData, description: '' }).success).toBe(false);
  });

  it('description이 256자이면 실패한다', () => {
    expect(
      profileEditSchema.safeParse({ ...validData, description: 'a'.repeat(256) }).success
    ).toBe(false);
  });

  it('모든 필드가 유효하지 않으면 여러 에러가 반환된다', () => {
    const result = profileEditSchema.safeParse({
      nickname: '',
      specialties: [],
      description: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.length).toBeGreaterThan(1);
  });
});
