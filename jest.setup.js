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
