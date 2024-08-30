import { literal } from 'lit/static-html.js';

import type { BlockSpec } from '../spec/type.js';

import { BlockService, FlavourExtension } from '../extension/index.js';
import './test-block.js';
import {
  type HeadingBlockModel,
  HeadingBlockSchema,
  NoteBlockSchema,
  RootBlockSchema,
} from './test-schema.js';

class TestPageService extends BlockService {
  static override flavour = 'test:page';
}

class TestNoteService extends BlockService {
  static override flavour = 'test:note';
}

class TestHeadingService extends BlockService {
  static override flavour = 'test:heading';
}

export const testSpecs: BlockSpec[] = [
  {
    schema: RootBlockSchema,
    view: {
      component: literal`test-root-block`,
    },
    extensions: [FlavourExtension('test:page'), TestPageService],
  },

  {
    schema: NoteBlockSchema,
    view: {
      component: literal`test-note-block`,
    },
    extensions: [FlavourExtension('test:note'), TestNoteService],
  },

  {
    schema: HeadingBlockSchema,
    view: {
      component: model => {
        const h = (model as HeadingBlockModel).type$.value;

        if (h === 'h1') {
          return literal`test-h1-block`;
        }

        return literal`test-h2-block`;
      },
    },
    extensions: [FlavourExtension('test:heading'), TestHeadingService],
  },
];
