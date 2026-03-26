import { Paths, File } from 'expo-file-system';

declare global {
  var __coverage__: Record<string, unknown> | undefined;
}

export function saveE2ECoverage(): void {
  if (!global.__coverage__) return;
  const file = new File(Paths.document, 'e2e-coverage.json');
  file.write(JSON.stringify(global.__coverage__));
}
