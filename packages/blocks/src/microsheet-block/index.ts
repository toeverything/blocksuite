import type { MicrosheetBlockModel } from '@blocksuite/affine-model';

export type { MicrosheetOptionsConfig } from './config.js';

export * from './data-source.js';
export * from './microsheet-block.js';
export * from './microsheet-service.js';
export { microsheetBlockColumns } from './properties/index.js';
declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:microsheet': MicrosheetBlockModel;
    }
  }
}
