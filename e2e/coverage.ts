export async function collectCoverage(): Promise<void> {
  if (process.env.E2E_COVERAGE !== 'true') return;
  await device.sendToHome();
}
