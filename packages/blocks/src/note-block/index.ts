import type { NoteBlockModel } from './note-model.js';
import type { NoteBlockService } from './note-service.js';

export * from './commands/index.js';
export * from './note-block.js';
export * from './note-edgeless-block.js';
export * from './note-model.js';
export * from './note-service.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:note': NoteBlockModel;
    }
    interface BlockServices {
      'affine:note': NoteBlockService;
    }
  }
}
