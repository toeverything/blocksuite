import { literal } from 'lit/static-html.js';

import type { BlockSpec } from '../spec/type.js';

import './test-block.js';
import {
  type HeadingBlockModel,
  HeadingBlockSchema,
  NoteBlockSchema,
  RootBlockSchema,
} from './test-schema.js';

export const testSpecs: BlockSpec[] = [
  {
    schema: RootBlockSchema,
    view: {
      component: literal`test-root-block`,
    },
  },

  {
    schema: NoteBlockSchema,
    view: {
      component: literal`test-note-block`,
    },
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
  },
];
