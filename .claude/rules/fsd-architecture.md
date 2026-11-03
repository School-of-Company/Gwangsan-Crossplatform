# FSD Architecture Rules

## Layer Dependency (imports only go downward)

```
app → view → widget → entity → shared
```

- **NEVER** import upward: `entity` must not import from `widget`, `view`, or `app`
- **NEVER** import across slices of the same layer: `widget/A` cannot import from `widget/B`
- Enforced by `fsd/layer-imports` (`scripts/eslint/fsd-layers.js`)

Violation examples:
```ts
// entity/post/model/useGetItem.ts
import { PostList } from '~/widget/post'; // ✗ upward import
import { useNotice } from '~/entity/notice'; // ✗ another slice of the same layer
```

## Slice Public API (barrel-only)

A slice is `src/<entity|widget|view>/<name>/`. Its `index.ts` is the only entry point for code
outside the slice. Enforced by `fsd/slice-public-api` (`scripts/eslint/slice-public-api.js`)
for production files; tests may import internal paths to `jest.mock` a single module.

```ts
// widget/chat/ui/ChatRoomList/index.tsx
import { useChatRooms } from '~/entity/chat'; // ✓ barrel
import { useChatRooms } from '~/entity/chat/model/useChatRooms'; // ✗ deep import into another slice

// app/chatting/[id]/index.tsx — route files import views through the barrel too
import { ChatRoomPage } from '~/view/chat'; // ✓

// entity/chat/model/useChatEntry.ts — inside the same slice
import { useChatRooms } from './useChatRooms'; // ✓ relative (or deep `~/entity/chat/...`)
import { useChatRooms } from '~/entity/chat'; // ✗ own barrel → circular import
```

- Every slice has an `index.ts`. Add a new export there when another slice starts using it
- Never import your own slice's barrel; the barrel imports your file back and creates a cycle
- After changing barrels, check cycles: `npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src`
- In tests, `jest.mock('~/entity/chat/model/useChatRooms')` still applies when the code imports
  `~/entity/chat`, because the barrel re-exports the mocked module. A factory mock of the barrel itself
  (`jest.mock('~/entity/chat', () => ({ ... }))`) must list every export the code under test uses,
  or spread `jest.requireActual('~/entity/chat')`

## shared Internal Dependencies

`shared/` has no slices; its subfolders may import each other only in these directions
(matches the current code):

| from      | may import                                  |
| --------- | ------------------------------------------- |
| `consts`  | —                                           |
| `types`   | `consts`                                    |
| `lib`     | `consts`, `types`, `store`                  |
| `store`   | `types`, pure helpers in `lib` (e.g. `getStep`) |
| `api`     | `lib`, `types`                              |
| `model`   | `api`, `lib`, `types`                       |
| `ui`      | `lib`, `model`, `store`, `types`, `consts`, `assets` |

- Nothing but `ui` imports `ui`; `consts`/`types` stay leaf modules
- `lib` → `store` exists for session cleanup (`clearSession`) and the toast queue patch. A `store`
  file must not import a `lib` module that imports `store` back
- Zustand stores live in `shared/store/` only; app-specific screens/tab bars belong in `widget/`

## Import Alias

Use `~/` for every import that leaves the current folder group. `@/` is banned by
`no-restricted-imports`. Relative imports are for files inside the same slice (or the same
`shared/<subfolder>`).

## Entity Internal Structure

```
src/entity/<domain>/
  api/<action>.ts            # axios call (`instance`), catch → `throw toAppError(error)`
  model/use<Name>.ts         # React Query hook (useQuery / useMutation)
  model/<name>QueryKeys.ts   # queryKey constants when >2 hooks share keys
  ui/<Component>/index.tsx   # Pure display component
  index.ts                   # Barrel export — public API only
```

Same structure applies in `widget/<feature>/` and `view/<feature>/`.

## Barrel Exports

`index.ts` exports only what other slices use. Do not re-export internal implementation details,
and remove an export when its last outside consumer goes away.

```ts
// ✓ src/entity/post/index.ts
export { useGetItem } from './model/useGetItem';
export { PostCard } from './ui/PostCard';
export type { PostDetailResponse } from './api/getItem';
```
