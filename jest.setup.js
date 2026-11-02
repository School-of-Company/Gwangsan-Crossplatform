// EXPO_PUBLIC_* 값은 앱 번들에서는 Metro(babel-preset-expo)가 인라인하지만 Jest에서는 런타임에
// process.env를 그대로 읽는다. 로컬 .env 유무·값에 테스트가 흔들리지 않도록 고정 placeholder를 둔다.
// Sentry DSN은 sentry.ts의 isValidDsn이 'test-placeholder'를 걸러 테스트에서 Sentry.init을 막는다.
process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test-placeholder@sentry.io/0';
process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = 'test-kakao-rest-api-key';
process.env.EXPO_PUBLIC_KAKAO_JS_KEY = 'test-kakao-js-key';

// axios 1.15.0 calls body.cancel() at module load time to detect fetch support.
// Expo's ReadableStream polyfill returns a rejected Promise when cancel() is called
// on a stream that has a reader, causing unhandled rejections in every test that
// imports axios. Suppress by converting the rejected Promise to a resolved one.
if (typeof ReadableStream !== 'undefined') {
  const originalCancel = ReadableStream.prototype.cancel;
  ReadableStream.prototype.cancel = function (...args) {
    try {
      const result = originalCancel.apply(this, args);
      if (result && typeof result.then === 'function') {
        return result.then(undefined, () => undefined);
      }
      return result;
    } catch {
      return Promise.resolve();
    }
  };
}

// Expo installs a lazy `fetch` getter onto globalThis that loads
// FetchResponse.ts at access time. FetchResponse extends the web Response
// class, but under Jest + Babel the super-class resolves to something other
// than a function, throwing "Super expression must either be null or a
// function". Removing the getter forces axios to fall back to its Node.js
// http adapter, which MSW continues to intercept normally.
try {
  delete globalThis.fetch;
} catch {
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: undefined,
  });
}
