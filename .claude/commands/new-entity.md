Scaffold a new FSD entity feature: $ARGUMENTS

## Usage

```
/new-entity <domain>[/<subdomain>]
```

Examples: `/new-entity notice`, `/new-entity trade/cancelForm`

## Instructions

1. **Parse the argument** to determine the entity path under `src/entity/`. If a subdomain is given (e.g. `trade/cancelForm`), the feature lives at `src/entity/trade/cancelForm/`.

2. **Read 1-2 nearby entities** (e.g. `src/entity/post/`) to understand the naming conventions and response types already in use before generating code.

3. **Create these 4 files** using the exact patterns from `src/entity/post/`:

### `api/<domain>Api.ts`

```ts
import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export interface <Domain>Response {
  // TODO: fill in fields
}

export const get<Domain> = async (id: string): Promise<<Domain>Response> => {
  try {
    const { data } = await instance.get<<Domain>Response>(`/<route>/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
```

### `model/use<Domain>.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { get<Domain>, <Domain>Response } from '../api/<domain>Api';

export const use<Domain> = (id: string | undefined) =>
  useQuery<<Domain>Response>({
    queryKey: ['<domain>', id],
    queryFn: () => {
      if (!id) throw new Error('need ID');
      return get<Domain>(id);
    },
    enabled: !!id,
  });
```

### `ui/<Domain>/index.tsx`

```tsx
import { View, Text } from 'react-native';

interface Props {
  // TODO: fill in props
}

export function <Domain>({ }: Props) {
  return (
    <View>
      <Text className="bodyMedium text-gray-900"></Text>
    </View>
  );
}
```

### `index.ts`

```ts
export { use<Domain> } from './model/use<Domain>';
export { <Domain> } from './ui/<Domain>';
export type { <Domain>Response } from './api/<domain>Api';
```

4. **After creating**, summarize the 4 file paths created and remind the user to:
   - Add real fields to `<Domain>Response`
   - Update the API endpoint path
   - Run `npx jest src/entity/<domain> --passWithNoTests` to confirm no type errors
