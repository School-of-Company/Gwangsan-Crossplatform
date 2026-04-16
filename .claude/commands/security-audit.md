Perform a comprehensive security audit of this React Native (Expo) codebase.

## Scope: $ARGUMENTS

`$ARGUMENTS`가 제공된 경우 해당 도메인으로 감사를 좁혀라 (예: `auth`, `storage`, `upload`, `network`).
제공되지 않은 경우 아래 6개 카테고리를 모두 실행하라.

---

## Pre-flight: 자동화 스캐너 먼저 실행

```bash
bash scripts/security-check.sh 2>&1
```

출력 결과를 주의 깊게 읽고 패턴 매칭된 항목을 심층 분석의 출발점으로 삼아라.

---

## 감사 카테고리

각 카테고리를 순서대로 처리하라. 각 발견 항목에 심각도를 부여하라:
- **CRITICAL** — 원격 공격자가 악용 가능, 데이터 유출 또는 계정 탈취
- **HIGH** — 로컬/물리적 접근으로 악용 가능, 심각한 데이터 노출
- **MEDIUM** — 공격 표면 증가, 보안 코딩 가이드라인 위반
- **LOW** — 심층 방어 개선, 정보 노출

---

### 1. 토큰 보안 저장소

`getData`, `setData`, `removeData`, `AsyncStorage` 사용처를 모두 찾아라.

확인 파일:
- `src/shared/lib/getData.ts`
- `src/shared/lib/setData.ts`
- `src/shared/lib/removeData.ts`
- `src/shared/lib/auth.ts`
- `src/shared/lib/axios.ts`

**알려진 취약점 — 현재 존재하는지 확인:**
`src/shared/lib/auth.ts`의 `getAccessToken()`/`getRefreshToken()`이 `getData()`를 호출하고, `getData()`는 AsyncStorage를 사용한다.
AsyncStorage는 Android에서 평문 SQLite, iOS에서 Secure Enclave 미사용이다.
`expo-secure-store`는 설치되어 있으나 토큰에 미사용.

**수정 코드 패턴 (이 프로젝트 스타일로):**
```ts
// src/shared/lib/secureData.ts  (신규 파일)
import * as SecureStore from 'expo-secure-store';

export const setSecureData = async (key: string, value: string): Promise<void> => {
  await SecureStore.setItemAsync(key, value);
};

export const getSecureData = async (key: string): Promise<string | null> => {
  return await SecureStore.getItemAsync(key);
};

export const removeSecureData = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key);
};
```

`src/shared/lib/auth.ts`에서 `getData` → `getSecureData`, `removeData` → `removeSecureData`로 교체.
`src/shared/lib/axios.ts`의 `setData('accessToken', ...)` → `setSecureData(...)`.

`memberId` 등 다른 `getData` 호출도 민감도를 판단해 마이그레이션 여부를 제안하라.

---

### 2. 비밀값 및 환경변수 노출

확인 파일:
- `.env` — `SENTRY_AUTH_TOKEN` 존재 여부, `.gitignore` 포함 여부
- `app.config.ts` — `extra:` 블록에 `SENTRY_AUTH_TOKEN` 번들링 여부
- `google-services.json` — git 추적 여부

git 히스토리 확인:
```bash
git log --oneline --all -- .env | head -5
git log --oneline --all -- google-services.json | head -3
```

**알려진 취약점:**
`.env`에 `SENTRY_AUTH_TOKEN`이 포함되어 있어 Sentry 프로젝트에 쓰기 접근이 가능하다.
git 히스토리에 `.env`가 있다면 이미 노출된 것이므로 즉시 토큰 로테이션 필요.

`app.config.ts`가 `SENTRY_AUTH_TOKEN`을 `extra:`에 넣지 않는다면 — 빌드타임 전용으로 안전함을 명시하라.

---

### 3. 생체인증 키체인 자격증명 저장

`src/entity/auth/api/signin.ts`를 전체 읽어라.

`saveCredentialsForBiometric()` 함수가 사용자의 **평문 password**를 Keychain에 저장하는지 확인하라.
Keychain은 암호화되어 있으나 평문 password 저장은 불필요하다 — 비밀 재사용 공격(credential stuffing) 위험을 높인다.
올바른 패턴은 token만 저장하거나, 생체인증으로 암호화된 세션 토큰을 저장하는 것이다.

**수정 코드 패턴:**
```ts
// 평문 password 대신 accessToken을 저장
export const saveTokenForBiometric = async (accessToken: string): Promise<void> => {
  const supported = await Keychain.getSupportedBiometryType();
  if (!supported) return;
  await Keychain.setGenericPassword('gwangsan_user', accessToken, {
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    authenticationPrompt: { title: '생체 인증으로 로그인' },
  });
};
```

생체인증 재로그인 시에는 저장된 accessToken으로 API를 호출하고, 만료되면 refreshToken으로 재발급받는 흐름을 제안하라.

---

### 4. 인증서 피닝

`src/shared/lib/axios.ts`에서 SSL 피닝 설정 여부를 확인하라.
`android/app/src/main/res/xml/network_security_config.xml` 존재 여부를 확인하라.

**알려진 취약점:** 인증서 피닝 없음 — 신뢰된 CA를 가진 MITM 공격자가 API 트래픽(토큰 포함)을 가로챌 수 있다.

Android 수정 방법:
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">api.gwangsan.io.kr</domain>
    <pin-set>
      <pin digest="SHA-256">YOUR_CERT_PIN_BASE64==</pin>
      <pin digest="SHA-256">BACKUP_CERT_PIN_BASE64==</pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

핀 값 추출 명령도 제공하라:
```bash
openssl s_client -connect api.gwangsan.io.kr:443 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | base64
```

---

### 5. 입력 유효성 검사 커버리지

Zod 스키마 파일 목록을 확인하라 (`src/**/*Schema.ts`, `src/**/*.schema.ts`).

`src/entity/*/api/*.ts`에서 `instance.post|instance.put|instance.patch`를 사용하는 파일 중
`.parse(` 또는 `.safeParse(`를 호출하지 않는 파일을 찾아라 — 스키마 없이 API 호출하는 케이스.

`src/shared/api/uploadImage.ts` 특별 확인:
- 파일 크기 검증 없음 (size/maxSize 체크)
- 파일 타입을 파일명 확장자로만 추론 (magic byte 검사 없음)

`src/entity/write/itemForm/` 확인:
- `gwangsan` (거래 금액) 필드에 최솟값/최댓값 검증이 있는지

발견된 검증 공백마다 구체적인 Zod 스키마 패치 코드를 이 프로젝트 스타일로 제안하라.

---

### 6. 프로덕션 콘솔 로깅

`src/`에서 `console.(log|error|warn|debug|info)`를 테스트 파일 제외하고 검색하라.

민감 용어(`token`, `password`, `auth`, `secret`, `credential`, `access`, `refresh`) 근처의 `console.*` 호출을 중점적으로 확인하라.

알려진 위치:
- `src/shared/lib/socket.ts` — 소켓 연결 오류 로깅 (요청 헤더/토큰 포함 가능)
- `src/entity/auth/api/signin.ts` — 생체인증 실패 로깅
- `src/shared/api/uploadImage.ts` — 업로드 오류 (Authorization 헤더 포함 가능)

**수정 패턴 — 프로덕션에서는 Sentry로 대체:**
```ts
// src/shared/lib/logger.ts  (신규 파일)
import * as Sentry from '@sentry/react-native';

export const logger = {
  error: (message: string, error?: unknown): void => {
    if (__DEV__) {
      console.error(message, error);
    } else {
      Sentry.captureException(error instanceof Error ? error : new Error(message));
    }
  },
  warn: (message: string): void => {
    if (__DEV__) {
      console.warn(message);
    }
  },
};
```

---

### 7. 추가 검사 (스코프 제한 없을 때)

**의존성 취약점:**
```bash
npm audit --audit-level=moderate 2>&1 | head -60
```
critical/high 중 auth, http, crypto 관련 패키지를 리포트하라.

**eslint-plugin-security 미설치:**
`package.json`과 `eslint.config.js`에서 확인. 미설치 시 설치 명령 제공:
```bash
npm install --save-dev eslint-plugin-security
```

**raw axios 우회:**
`src/shared/lib/axios.ts` 외에서 `axios.create|axios.get|axios.post` 사용 시 — 인터셉터 우회로 인증 없이 API 호출 가능.

---

## 출력 형식

모든 검사 완료 후 구조화된 리포트를 출력하라:

```
## 보안 감사 리포트 — Gwangsan Crossplatform
날짜: <오늘 날짜>

### 요약
| 심각도   | 건수 |
|----------|------|
| CRITICAL |      |
| HIGH     |      |
| MEDIUM   |      |
| LOW      |      |

---

### CRITICAL 발견 항목

#### [CRIT-01] <제목>
- **파일**: `path/to/file.ts` (N번 줄)
- **설명**: 취약점과 악용 가능성
- **영향**: 공격자가 달성할 수 있는 것
- **수정**: 구체적인 코드 변경
- **작업량**: S / M / L

---

### HIGH 발견 항목
...

### MEDIUM 발견 항목
...

### LOW 발견 항목
...

---

### 검증 완료 항목 (확인하여 이상 없음)
- [ ] .env가 git에서 제외됨
- [ ] SENTRY_AUTH_TOKEN이 앱 바이너리에 번들링되지 않음
- [ ] Axios 인스턴스가 HTTPS baseURL만 사용
- [ ] Zod 스키마가 signup/signin 필드를 커버함
- [ ] Keychain이 BIOMETRY_ANY 접근 제어 사용 (하드웨어 바인딩)

---

### 우선순위별 권고사항
1. ...
2. ...
```

리포트를 생략하지 말 것. 모든 발견 항목에 구체적인 수정 코드를 포함하라.
