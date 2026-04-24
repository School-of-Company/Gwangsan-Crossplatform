#!/usr/bin/env bash
# security-check.sh — Gwangsan Crossplatform 보안 취약점 자동 정적 분석
# 사용법: bash scripts/security-check.sh
# 종료코드: 항상 0 (CI 블로킹 방지). 발견 항목 수는 정보 제공용.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

TOTAL=0

# ── 헬퍼 ──────────────────────────────────────────────────────────────────────

banner() {
  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════${RESET}"
  echo -e "${BOLD}${CYAN}  $1${RESET}"
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════${RESET}"
}

crit()   { TOTAL=$((TOTAL+1)); echo -e "  ${RED}[CRITICAL]${RESET} $1"; }
high()   { TOTAL=$((TOTAL+1)); echo -e "  ${RED}[HIGH]${RESET}     $1"; }
medium() { TOTAL=$((TOTAL+1)); echo -e "  ${YELLOW}[MEDIUM]${RESET}   $1"; }
low()    { TOTAL=$((TOTAL+1)); echo -e "  ${YELLOW}[LOW]${RESET}      $1"; }
ok()     { echo -e "  ${GREEN}[OK]${RESET}       $1"; }

# src/ 전체 grep (테스트 파일 제외)
gsrc() {
  grep -rn --include="*.ts" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=__tests__ \
    --exclude="*.test.ts" --exclude="*.test.tsx" \
    "$@" "$SRC" 2>/dev/null || true
}

# ── 1. 토큰 보안 저장소 ────────────────────────────────────────────────────────

banner "1. 토큰 보안 저장소 (AsyncStorage vs SecureStore)"

ASYNC_FILES=$(gsrc -l "AsyncStorage" | grep -v __tests__ || true)
SECURE_FILES=$(gsrc -l "expo-secure-store\|SecureStore" | grep -v __tests__ || true)

# SecureStore와 함께 쓰는 파일은 라우팅 레이어 — 정상
ASYNC_ONLY=$(comm -23 \
  <(echo "$ASYNC_FILES" | sort) \
  <(echo "$SECURE_FILES" | sort) 2>/dev/null || \
  grep -Fvf <(echo "$SECURE_FILES") <(echo "$ASYNC_FILES") 2>/dev/null || true)

if [ -n "$ASYNC_ONLY" ]; then
  crit "AsyncStorage만 단독으로 사용하는 파일 — SecureStore 미사용 (토큰 비보호 위험):"
  echo "$ASYNC_ONLY" | sed 's/^/    /'
else
  ok "AsyncStorage 단독 사용 없음 (민감 키는 SecureStore 라우팅 적용됨)"
fi

if [ -z "$SECURE_FILES" ]; then
  crit "expo-secure-store가 설치되어 있으나 src/ 에서 전혀 import되지 않음 — 토큰이 비보호 상태"
else
  ok "expo-secure-store 사용 파일: $(echo "$SECURE_FILES" | tr '\n' ' ')"
fi

# ── 2. 비밀값 및 환경변수 노출 ──────────────────────────────────────────────────

banner "2. 비밀값 / 환경변수 노출"

if [ -f "$ROOT/.env" ]; then
  if git -C "$ROOT" check-ignore -q "$ROOT/.env" 2>/dev/null; then
    ok ".env가 .gitignore에 포함됨"
  else
    crit ".env 파일이 .gitignore에 없음"
  fi

  if grep -q "SENTRY_AUTH_TOKEN=sntrys_" "$ROOT/.env" 2>/dev/null; then
    crit ".env에 유효한 SENTRY_AUTH_TOKEN 존재 — sentry.io에서 즉시 로테이션 필요"
  fi
else
  ok ".env 파일 없음"
fi

ENV_HIST=$(git -C "$ROOT" log --oneline --all -- .env 2>/dev/null | head -3 || true)
if [ -n "$ENV_HIST" ]; then
  crit ".env가 git 히스토리에 존재함 — 토큰이 이미 노출됨:"
  echo "$ENV_HIST" | sed 's/^/    /'
else
  ok ".env가 git 히스토리에 없음"
fi

HARDCODED=$(gsrc -Ei "(sntrys_[A-Za-z0-9_]{20,}|api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9]{16,})" || true)
if [ -n "$HARDCODED" ]; then
  crit "소스 코드에 하드코딩된 비밀값 패턴:"
  echo "$HARDCODED" | sed 's/^/    /'
else
  ok "src/에 하드코딩된 비밀값 패턴 없음"
fi

if [ -f "$ROOT/app.config.ts" ]; then
  if grep -A20 "extra:" "$ROOT/app.config.ts" 2>/dev/null | grep -q "SENTRY_AUTH_TOKEN"; then
    crit "app.config.ts의 extra: 블록에 SENTRY_AUTH_TOKEN 포함 — 앱 바이너리에 번들됨"
  else
    ok "SENTRY_AUTH_TOKEN이 app.config.ts extra:에 노출되지 않음 (빌드타임 전용)"
  fi
fi

GSERVICES="$ROOT/google-services.json"
if [ -f "$GSERVICES" ] && ! git -C "$ROOT" check-ignore -q "$GSERVICES" 2>/dev/null; then
  GS_HIST=$(git -C "$ROOT" log --oneline --all -- google-services.json 2>/dev/null | head -1 || true)
  if [ -n "$GS_HIST" ]; then
    medium "google-services.json이 git에 추적됨 (Firebase 프로젝트 설정 노출)"
  fi
fi

# ── 3. 키체인 평문 자격증명 ────────────────────────────────────────────────────

banner "3. 생체인증 / 키체인 자격증명 저장"

KEYCHAIN_CALLS=$(gsrc -n "setGenericPassword" | grep -v __tests__ || true)
if [ -n "$KEYCHAIN_CALLS" ]; then
  echo -e "  ${YELLOW}setGenericPassword 호출 발견 (파라미터 확인 필요):${RESET}"
  echo "$KEYCHAIN_CALLS" | sed 's/^/    /'
  # 두 번째 파라미터가 token/Token/access/refresh 계열이 아닌 경우를 평문 password로 간주
  PLAINTEXT_PASS=$(echo "$KEYCHAIN_CALLS" \
    | grep -vE "(token|Token|access|refresh|jwt|JWT)" \
    | grep -iE "setGenericPassword\([^,]+,\s*[^,)]*(password|pw|pass|secret)" || true)
  if [ -n "$PLAINTEXT_PASS" ]; then
    high "setGenericPassword() 호출 중 token 계열이 아닌 파라미터 감지 — 평문 password 저장 의심:"
    echo "$PLAINTEXT_PASS" | sed 's/^/    /'
  else
    ok "setGenericPassword() 호출이 token 계열 파라미터를 사용함 (안전)"
  fi
else
  ok "setGenericPassword 호출 없음"
fi

# ── 4. 인증서 피닝 ────────────────────────────────────────────────────────────

banner "4. 인증서 피닝 (Certificate Pinning)"

PINNING=$(gsrc -l "ssl.*pin\|cert.*pin\|publicKeyHash\|TrustKit\|react-native-ssl-pinning" || true)
if [ -z "$PINNING" ]; then
  high "src/에 인증서 피닝 설정 없음"
else
  ok "피닝 관련 코드 발견: $PINNING"
fi

ANDROID_NSC="$ROOT/android/app/src/main/res/xml/network_security_config.xml"
if [ -f "$ANDROID_NSC" ]; then
  if grep -q "pin-set" "$ANDROID_NSC" 2>/dev/null; then
    ok "Android network_security_config.xml에 pin-set 존재"
  else
    high "network_security_config.xml 존재하나 <pin-set> 없음 — 피닝 미설정"
  fi
else
  high "android/app/.../network_security_config.xml 없음 — Android 인증서 피닝 없음"
fi

# ── 5. 파일 업로드 유효성 검사 ────────────────────────────────────────────────

banner "5. 파일 업로드 유효성 검사"

UPLOAD="$SRC/shared/api/uploadImage.ts"
if [ -f "$UPLOAD" ]; then
  if grep -qE "size|maxSize|MAX_SIZE|byteLength" "$UPLOAD" 2>/dev/null; then
    ok "uploadImage.ts에 파일 크기 검증 있음"
  else
    medium "uploadImage.ts에 파일 크기 검증 없음 (size/maxSize 미사용)"
  fi

  if grep -qE "magic|mime|getInfoAsync|application/octet" "$UPLOAD" 2>/dev/null; then
    ok "uploadImage.ts에 파일 타입 검증 있음"
  else
    medium "uploadImage.ts가 파일 타입을 확장자로만 추론 — magic byte/MIME 검사 없음"
    echo "    파일: src/shared/api/uploadImage.ts"
  fi
else
  echo "  [SKIP] src/shared/api/uploadImage.ts 없음"
fi

UPLOADER="$SRC/shared/ui/ImageUploader/index.tsx"
if [ -f "$UPLOADER" ]; then
  if grep -qE "maxSize|fileSize|MAX_FILE" "$UPLOADER" 2>/dev/null; then
    ok "ImageUploader.tsx에 최대 파일 크기 제한 있음"
  else
    medium "ImageUploader.tsx에 클라이언트 사이드 파일 크기 제한 없음"
  fi
fi

# ── 6. 프로덕션 콘솔 로깅 ────────────────────────────────────────────────────

banner "6. 프로덕션 콘솔 로깅"

CONSOLE_ALL=$(gsrc -En "console\.(log|error|warn|debug|info)\(" || true)
if [ -n "$CONSOLE_ALL" ]; then
  COUNT=$(echo "$CONSOLE_ALL" | wc -l | tr -d ' ')
  low "프로덕션 소스에 console.* 호출 ${COUNT}건 (기기 로그에 PII/토큰 노출 가능)"
  SENSITIVE=$(echo "$CONSOLE_ALL" | grep -iE "token|password|auth|secret|credential|access|refresh" || true)
  if [ -n "$SENSITIVE" ]; then
    medium "민감 용어 근처의 console.* 호출:"
    echo "$SENSITIVE" | sed 's/^/    /'
  fi
else
  ok "프로덕션 소스에 console.* 없음"
fi

# ── 7. Zod 유효성 검사 커버리지 ──────────────────────────────────────────────

banner "7. Zod 유효성 검사 커버리지"

ZOD_FILES=$(find "$SRC" \( -name "*Schema.ts" -o -name "*.schema.ts" \) \
  ! -path "*/node_modules/*" ! -path "*/__tests__/*" 2>/dev/null || true)
ZOD_COUNT=$(echo "$ZOD_FILES" | grep -c "." 2>/dev/null || echo 0)
echo "  Zod 스키마 파일 ${ZOD_COUNT}개:"
echo "$ZOD_FILES" | sed 's/^/    /'

MUTATION_COUNT=$(gsrc -l "instance\.post\|instance\.put\|instance\.patch" | grep "/api/" | wc -l | tr -d ' ')
PARSE_COUNT=$(gsrc -l "\.parse(\|\.safeParse(" | wc -l | tr -d ' ')
echo ""
echo "  mutation API 파일: ${MUTATION_COUNT}개 / .parse 사용 파일: ${PARSE_COUNT}개"

CURRENCY=$(gsrc -n "gwangsan\|currency\|amount" "$SRC/entity/write" 2>/dev/null \
  | grep -iE "min|max|positive|parse" || true)
if [ -z "$CURRENCY" ]; then
  medium "write 엔티티에서 거래 금액(gwangsan)의 min/max 검증 미확인 — itemFormSchema.ts 직접 확인 필요"
fi

# ── 8. eslint-plugin-security ────────────────────────────────────────────────

banner "8. eslint-plugin-security"

if grep -q "eslint-plugin-security" "$ROOT/package.json" 2>/dev/null; then
  ok "eslint-plugin-security 설치됨"
  if grep -q "security" "$ROOT/eslint.config.js" 2>/dev/null; then
    ok "eslint.config.js에 security 플러그인 설정됨"
  else
    medium "eslint-plugin-security 설치됨 but eslint.config.js에 미설정"
  fi
else
  medium "eslint-plugin-security 미설치 — eval(), 위험한 정규식(ReDoS), prototype pollution 자동 탐지 불가"
  echo "    설치: npm install --save-dev eslint-plugin-security"
fi

# ── 9. Axios 인터셉터 우회 ───────────────────────────────────────────────────

banner "9. Axios 인스턴스 위생"

RAW_AXIOS=$(gsrc -n "axios\.create\|axios\.get\|axios\.post\|axios\.put\|axios\.delete" \
  | grep -v "shared/lib/axios.ts" | grep -v __tests__ || true)
if [ -n "$RAW_AXIOS" ]; then
  medium "shared/lib/axios.ts 외부에서 raw axios 사용 — 인증 인터셉터 우회 가능:"
  echo "$RAW_AXIOS" | sed 's/^/    /'
else
  ok "모든 axios 호출이 shared instance를 통함"
fi

# ── 요약 ─────────────────────────────────────────────────────────────────────

banner "스캔 완료"

if [ "$TOTAL" -eq 0 ]; then
  echo -e "  ${GREEN}자동화 검사에서 발견 항목 없음.${RESET}"
else
  echo -e "  ${BOLD}총 발견 항목: ${RED}${TOTAL}건${RESET}"
  echo ""
  echo -e "  다음 단계: Claude Code에서 ${CYAN}/security-audit${RESET} 실행 — 심층 분석 및 수정 코드 제안"
fi

echo ""
exit 0
