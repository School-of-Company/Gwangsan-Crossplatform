import * as FileSystem from 'expo-file-system/legacy';

declare global {
  var __coverage__: Record<string, unknown> | undefined;
}

export async function saveE2ECoverage(): Promise<void> {
  if (!global.__coverage__) return;
  await FileSystem.writeAsStringAsync(
    FileSystem.documentDirectory + 'e2e-coverage.json',
    JSON.stringify(global.__coverage__)
  );
}
