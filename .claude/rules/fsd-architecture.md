# FSD Architecture Rules

## Layer Dependency (imports only go downward)

```
app → view → widget → entity → shared
```

- **NEVER** import upward: `entity` must not import from `widget`, `view`, or `app`
- **NEVER** import across same layer: `widget/A` cannot import from `widget/B`
- `shared/` subdirs must not cross-import each other

Violation examples:
```ts
// entity/post/model/useGetItem.ts
import { PostList } from '~/widget/post/ui/PostList'; // ✗ upward import
import { useNotice } from '~/entity/notice/model/useNotice'; // ✗ cross-layer
```

## Entity Internal Structure

```
src/entity/<domain>/
  api/<action>.ts            # axios call, throws Error(getErrorMessage(e))
  model/use<Name>.ts         # React Query hook (useQuery / useMutation)
  model/<name>QueryKeys.ts   # queryKey constants when >2 hooks share keys
  ui/<Component>/index.tsx   # Pure display component
  index.ts                   # Barrel export — public API only
```

Same structure applies in `widget/<feature>/` and `view/<feature>/`.

## Barrel Exports

`index.ts` exports only what consumers need. Do not re-export internal implementation details.

```ts
// ✓ src/entity/post/index.ts
export { useGetItem } from './model/useGetItem';
export { PostCard } from './ui/PostCard';
export type { PostDetailResponse } from './api/getItem';
```
