export async function collectCoverage(): Promise<void> {
  if (process.env.E2E_COVERAGE !== 'true') return;
  await device.sendToHome();
  await new Promise((r) => setTimeout(r, 1500));
}
