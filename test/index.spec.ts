// Helpers
import { DexieCrossHost, DexieCrossClient } from '../src/index.js';

describe('Index', () => {
  it('should properly export dexie cross', () => {
    expect(DexieCrossHost).toBeDefined();
    expect(DexieCrossClient).toBeDefined();
  });
});
