/* global __dirname */
const detoxTeardown = require('detox/runners/jest/globalTeardown');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUNDLE_ID = 'kr.hs.gsm.gwangsan';
const COVERAGE_DIR = path.join(__dirname, '../coverage');
const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 30000;

function getSimId() {
  if (process.env.SIM_ID) return process.env.SIM_ID;
  const output = execSync('xcrun simctl list devices booted --json').toString();
  const data = JSON.parse(output);
  for (const devices of Object.values(data.devices)) {
    const booted = devices.find((d) => d.state === 'Booted');
    if (booted) return booted.udid;
  }
  return null;
}

async function pollForFile(filePath) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (fs.existsSync(filePath)) return true;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

module.exports = async () => {
  if (process.env.E2E_COVERAGE === 'true') {
    try {
      const simId = getSimId();
      if (!simId) {
        console.warn('[e2e-coverage] No booted simulator found, skipping coverage');
      } else {
        const container = execSync(`xcrun simctl get_app_container ${simId} ${BUNDLE_ID} data`)
          .toString()
          .trim();

        const coverageFile = path.join(container, 'Documents', 'e2e-coverage.json');
        const found = await pollForFile(coverageFile);

        if (found) {
          fs.mkdirSync(COVERAGE_DIR, { recursive: true });
          fs.copyFileSync(coverageFile, path.join(COVERAGE_DIR, 'e2e-coverage.json'));
          console.log('[e2e-coverage] Coverage collected successfully');
        } else {
          console.warn(
            `[e2e-coverage] Timed out after ${POLL_TIMEOUT_MS}ms waiting for coverage file`
          );
        }
      }
    } catch (e) {
      console.error('[e2e-coverage] Failed to collect coverage:', e.message);
    }
  }

  await detoxTeardown();
};
