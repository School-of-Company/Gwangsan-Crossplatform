# Code Patterns

## API Function

> Ref: `src/entity/post/api/getItem.ts`

```ts
import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export interface XxxResponse { /* fields */ }

export const getXxx = async (id: string): Promise<XxxResponse> => {
  try {
    const { data } = await instance.get<XxxResponse>(`/xxx/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
```

Rules:
- Always use `instance` from `~/shared/lib/axios`, never raw `fetch` or `axios`
- Wrap catch with `getErrorMessage`, never swallow errors silently
- Return typed response, no `any`

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
