# Code Patterns

## API Function

> Ref: `src/entity/post/api/getItem.ts`

```ts
import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface XxxResponse { /* fields */ }

export const getXxx = async (id: string): Promise<XxxResponse> => {
  try {
    const { data } = await instance.get<XxxResponse>(`/xxx/${id}`);
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};
```

Rules:
- Always use `instance` from `~/shared/lib/axios`, never raw `fetch` or `axios`
- Catch with `throw toAppError(error)`, never swallow errors silently
  - `toAppError` sets the user-facing message (`getErrorMessage`) **on the original error** and keeps the `AxiosError`,
    so `QueryProvider`'s `shouldRetryQuery` (no retry on 4xx) and `throwOnError` (5xx → ErrorBoundary) can read `response.status`
  - ✗ `throw new Error(getErrorMessage(error))` — drops the `AxiosError`; 4xx gets retried and 5xx never reaches ErrorBoundary
  - ✗ `throw error` — keeps the status but shows axios's raw English message in toasts
  - Logging is fine before rethrowing: `logger.error('xxx failed', error); throw toAppError(error);`
- Return typed response, no `any`

### `axios.create` exceptions

Only these two files create their own axios instance; everything else uses `instance`:

| File | Why | Notes |
| --- | --- | --- |
| `src/shared/lib/publicInstance.ts` | Requests before login (SMS, sign-in, password reset) — no token, no 401 refresh | 10s timeout. Callers still `throw toAppError(error)` |
| `src/shared/api/kakaoLocalSearch.ts` (`kakaoClient`) | Third-party Kakao Local API (`dapi.kakao.com`), not our server | 10s timeout, `KakaoAK` header. Must not go through `instance` (would attach our Bearer token). Kakao error bodies differ from ours, so it uses its own `toKakaoError` instead of `toAppError` |

Do not add another `axios.create` without a reason of the same kind.

## React Query Hook

> Ref: `src/entity/post/model/useGetItem.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { getXxx, XxxResponse } from '../api/xxxApi';

export const useXxx = (id: string | undefined) =>
  useQuery<XxxResponse>({
    queryKey: ['xxx', id],
    queryFn: () => {
      if (!id) throw new Error('need ID');
      return getXxx(id);
    },
    enabled: !!id,
  });
```

Rules:
- Server state lives in React Query, **never** in Zustand
- `queryKey` must be an array: `['domain', param]`
- Guard optional params with `enabled: !!id`
- Mutations use `useMutation` + `queryClient.invalidateQueries` on success

## Zustand Store

> Ref: `src/shared/store/useSigninStore.ts`

```ts
import { create } from 'zustand';

interface State { field: string; setField: (v: string) => void; reset: () => void; }
const initialState = { field: '' };

export const useXxxStore = create<State>()((set) => ({
  ...initialState,
  setField: (v) => set({ field: v }),
  reset: () => set(initialState),
}));
```

Rules:
- Zustand is for **UI/form state only** (multi-step flows, local toggles)
- Always include a `reset` action
- Store files live in `src/shared/store/` only

## NativeWind Styling

```tsx
// ✓ Use className with custom tokens
<View className="flex-1 bg-main px-4 py-3">
  <Text className="titleMedium text-white">제목</Text>
</View>

// ✗ Never use StyleSheet
const styles = StyleSheet.create({ ... });
```

Custom colors: `main` (green) · `sub` (blue) · `sub2` (orange) · `error` (red) · `gray-*`
Custom text: `titleLarge/Medium/Small` · `bodyLarge/Medium/Small` · `caption`

## Import Alias

```ts
import { instance } from '~/shared/lib/axios';   // ✓ preferred
import { Button } from '@/shared/ui/Button';      // ✓ also OK
import { Button } from '../../../shared/ui/Button'; // ✗
```

## Comments

Write a comment only for the *why* that the code cannot show: a platform workaround, a server
contract, a non-obvious constraint. Keep it to 1–3 lines.

```ts
// ✓ 안드로이드 한글 조합 중 value를 다시 넣으면 자소가 분리되므로 입력 중에는 제어하지 않는다
// ✓ 서버 페이지 계약 (Gwangsan-Server#405) — size 1~100, last_id 커서

// ✗ 예전에는 토스트가 두 번 떴다(#739)     ← change history: belongs in the commit/PR
// ✗ 지점 변경 API 추가 (#781)               ← own issue number: belongs in the commit
```

Rules:
- No change history ("예전에는 ~", "~가 원인이었다") and no issue numbers of this repo (`#NNN`) — put them in the commit message or PR
- References to another repo's contract (e.g. `Gwangsan-Server#405`) are OK when they explain where an API rule comes from
- Keep workaround notes that prevent a regression (e.g. Fabric `scrollTo` frame skip, Android Hangul IME), but compress them to the reason
