import type { NoteBlockService } from './note-service.js';

export * from './commands/index.js';
export * from './note-block.js';
export * from './note-edgeless-block.js';
export * from './note-service.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:note': NoteBlockService;
    }
  }
}
