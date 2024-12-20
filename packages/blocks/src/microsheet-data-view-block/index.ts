import type { MicrosheetDataViewBlockModel } from './data-view-model.js';

export * from './data-view-block.js';
export * from './data-view-model.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:microsheet-data-view': MicrosheetDataViewBlockModel;
    }
  }
}
