/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...require('./jest.e2e.config.js'),
  globalTeardown: './e2e/globalTeardown.coverage.js',
};
