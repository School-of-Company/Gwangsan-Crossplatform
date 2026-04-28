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
