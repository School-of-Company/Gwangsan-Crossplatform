Write unit tests for the specified file or feature: $ARGUMENTS

## Project Testing Context

- **Framework**: Jest + React Testing Library
- **API mocking**: MSW (mocks in `src/mocks/`)
- **Test helpers**: `src/test-utils/` — import via `@/test-utils` (`renderWithProviders`, `renderHookWithProviders`, `createQueryWrapper`)
- **Path alias**: `@/` maps to `src/`
- **Run tests**: `npx jest src/path/to/file.test.ts --no-coverage`

## Instructions

1. **Read the target file first** before writing any tests. Understand what it actually does.

2. **Follow existing test patterns** — check nearby `.test.ts` files for conventions used in this codebase.

3. **Test structure**:
   - Place test file next to the source file: `foo.ts` → `foo.test.ts`
   - Group with `describe`, name cases with `it` or `test`
   - Use `@/test-utils` render helpers for components

4. **API calls**: Mock with MSW handlers. Add handlers to `src/mocks/handlers/` if they don't exist yet.

5. **React Query**: Wrap components in `QueryClientProvider` using the test-utils wrapper.

6. **What to test**:
   - Happy path (normal expected behavior)
   - Error states (API failures, validation errors)
   - Edge cases specific to the feature
   - User interactions for UI components

7. **What NOT to test**:
   - Implementation details (internal state, private methods)
   - Third-party library internals
   - Trivial pass-through code

8. **Zustand stores**: Test state transitions using `act`:
   ```ts
   import { act } from '@testing-library/react-native';
   const { setField } = useXxxStore.getState();
   act(() => setField('value'));
   expect(useXxxStore.getState().field).toBe('value');
   ```

9. After writing, run the tests to confirm they pass:
   ```bash
   npx jest <test-file-path> --no-coverage
   ```
   Fix any failures before finishing.
