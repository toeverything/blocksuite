import type { NoteBlockModel } from './note-model.js';
import type { NoteService } from './note-service.js';

export * from './note-block.js';
export * from './note-model.js';
export * from './note-service.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:note': NoteBlockModel;
    }
    interface BlockServices {
      'affine:note': NoteService;
    }
  }
}
