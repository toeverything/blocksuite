import { literal } from 'lit/static-html.js';

import type { HeadingBlockModel } from './test-schema.js';

import {
  BlockService,
  BlockViewExtension,
  type ExtensionType,
  FlavourExtension,
} from '../extension/index.js';
import './test-block.js';

class TestPageService extends BlockService {
  static override flavour = 'test:page';
}

class TestNoteService extends BlockService {
  static override flavour = 'test:note';
}

class TestHeadingService extends BlockService {
  static override flavour = 'test:heading';
}

export const testSpecs: ExtensionType[] = [
  FlavourExtension('test:page'),
  TestPageService,
  BlockViewExtension('test:page', literal`test-root-block`),

  FlavourExtension('test:note'),
  TestNoteService,
  BlockViewExtension('test:note', literal`test-note-block`),

  FlavourExtension('test:heading'),
  TestHeadingService,
  BlockViewExtension('test:heading', model => {
    const h = (model as HeadingBlockModel).type$.value;

    if (h === 'h1') {
      return literal`test-h1-block`;
    }

    return literal`test-h2-block`;
  }),
];
