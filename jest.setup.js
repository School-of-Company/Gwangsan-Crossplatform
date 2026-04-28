// axios 1.x fetch adapter detects fetch support at module load time by creating
// and cancelling a ReadableStream. Expo's polyfill throws "Cannot cancel a stream
// that already has a reader" in this case, crashing any test that imports axios.
if (typeof ReadableStream !== 'undefined') {
  const originalCancel = ReadableStream.prototype.cancel;
  ReadableStream.prototype.cancel = function (...args) {
    try {
      return originalCancel.apply(this, args);
    } catch {
      return Promise.resolve();
    }
  };
}
