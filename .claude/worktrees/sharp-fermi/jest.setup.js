// Mock expo winter modules to prevent "import outside scope" errors
// These lazy-loaded globals cause issues in the Jest jsdom environment
jest.mock('expo/src/winter/ImportMetaRegistry', () => ({
  ImportMetaRegistry: { url: null },
}));

// Pre-define globals that expo/src/winter tries to lazily install
// so the lazy require() never fires during test execution
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
