import type { IdGenerator } from '../utils/id-generator.js';

export * from './test-doc.js';
export * from './test-meta.js';
export * from './test-workspace.js';

export function createAutoIncrementIdGenerator(): IdGenerator {
  let i = 0;
  return () => (i++).toString();
}
