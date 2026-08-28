import { File, Paths } from 'expo-file-system';
import { saveE2ECoverage } from '../e2eCoverage';

jest.mock('expo-file-system', () => ({
  Paths: { document: 'file:///mock-doc-dir/' },
  File: jest.fn(),
}));

const MockFile = File as unknown as jest.Mock;
const mockWrite = jest.fn();

// Jest's own coverage instrumentation stores real coverage data on this same
// global. Overwriting it with a fake value and leaving it set would corrupt
// coverage collection for every test file that runs afterward in this worker.
const realCoverage = (global as any).__coverage__;

beforeEach(() => {
  jest.clearAllMocks();
  MockFile.mockImplementation(() => ({ write: mockWrite }));
  delete (global as any).__coverage__;
});

afterEach(() => {
  (global as any).__coverage__ = realCoverage;
});

describe('saveE2ECoverage', () => {
  it('does nothing when global.__coverage__ is not set', () => {
    saveE2ECoverage();

    expect(MockFile).not.toHaveBeenCalled();
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('writes the coverage object to a file when global.__coverage__ is set', () => {
    (global as any).__coverage__ = { 'src/foo.ts': { s: { '0': 1 } } };

    saveE2ECoverage();

    expect(MockFile).toHaveBeenCalledWith(Paths.document, 'e2e-coverage.json');
    expect(mockWrite).toHaveBeenCalledWith(JSON.stringify({ 'src/foo.ts': { s: { '0': 1 } } }));
  });
});
