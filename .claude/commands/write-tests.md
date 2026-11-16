Write unit tests for the specified file or feature: $ARGUMENTS

## Project Testing Context

- **Framework**: Jest + React Testing Library
- **API mocking**: MSW. 공용 서버는 `src/mocks/server.ts`이고 `jest.setup.after-env.js`가 시작·초기화한다. 기본 핸들러는 `src/mocks/handlers/`
- **Test helpers**: `src/test-utils/` — import via `~/test-utils` (`renderWithProviders`, `renderHookWithProviders`, `createQueryWrapper`)
- **Path alias**: `~/` maps to `src/`
- **Run tests**: `npx jest src/path/to/file.test.ts --no-coverage`

## Instructions

1. **Read the target file first** before writing any tests. Understand what it actually does.

2. **Follow existing test patterns** — check nearby `.test.ts` files for conventions used in this codebase.

3. **Test structure**:
   - Place the test in a `__tests__/` folder next to the source file: `foo.ts` → `__tests__/foo.test.ts`
   - Group with `describe`, name cases with `it` or `test`
   - Use `~/test-utils` render helpers for components

4. **API calls**: `jest.mock('~/shared/lib/axios')`로 instance를 가짜로 바꾸지 말고, 실제 `instance`와 공용 MSW 서버를 쓴다.
   기준 예시는 `src/entity/post/api/__tests__/getItem.test.ts`.
   - `beforeAll`에서 `instance.defaults.baseURL`을 지정하고, 테스트마다 `server.use(http.get(...))`로 핸들러를 덮어쓴다(매 테스트 뒤 자동 초기화).
   - 핸들러가 없는 요청은 테스트가 실패한다. 네트워크 오류는 `HttpResponse.error()`로 만든다.
   - 4xx/5xx는 `toBeInstanceOf(AxiosError)`와 `response?.status`, 메시지를 함께 검증한다.
   - 여러 테스트가 같은 응답을 쓰면 `src/mocks/handlers/`에 기본 핸들러를 추가한다.

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
