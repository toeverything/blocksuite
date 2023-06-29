export * from './block.js';
export * from './text.js';

declare global {
  type BlockSuiteSelectionType = keyof BlockSuiteSelection;
}
