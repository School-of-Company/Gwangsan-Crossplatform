/* global __dirname */
const detoxTeardown = require('detox/runners/jest/globalTeardown');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUNDLE_ID = 'kr.hs.gsm.gwangsan';
const COVERAGE_DIR = path.join(__dirname, '../coverage');

module.exports = async () => {
  await detoxTeardown();

  if (process.env.E2E_COVERAGE !== 'true') return;

  const simId = process.env.SIM_ID;
  if (!simId) {
    console.warn('[e2e-coverage] SIM_ID not set, skipping coverage collection');
    return;
  }

  try {
    const container = execSync(`xcrun simctl get_app_container ${simId} ${BUNDLE_ID} data`)
      .toString()
      .trim();

    const coverageFile = path.join(container, 'Documents', 'e2e-coverage.json');
    if (!fs.existsSync(coverageFile)) {
      console.warn('[e2e-coverage] Coverage file not found at', coverageFile);
      return;
    }

    fs.mkdirSync(COVERAGE_DIR, { recursive: true });
    fs.copyFileSync(coverageFile, path.join(COVERAGE_DIR, 'e2e-coverage.json'));
    console.log('[e2e-coverage] Coverage collected successfully');
  } catch (e) {
    console.error('[e2e-coverage] Failed to collect coverage:', e.message);
  }
};
