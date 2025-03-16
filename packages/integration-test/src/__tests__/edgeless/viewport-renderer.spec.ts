import { ParagraphLayoutHandlerExtension } from '@blocksuite/affine/blocks/paragraph';
import {
  TurboRendererConfigFactory,
  ViewportTurboRendererExtension,
} from '@blocksuite/affine-gfx-turbo-renderer';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { addSampleNotes } from '../utils/doc-generator.js';
import { createPainterWorker, setupEditor } from '../utils/setup.js';

describe('viewport turbo renderer', () => {
  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless', [
      ParagraphLayoutHandlerExtension,
      TurboRendererConfigFactory({
        painterWorkerEntry: createPainterWorker,
      }),
      ViewportTurboRendererExtension,
    ]);
    return cleanup;
  });

  test('should render 6 notes in viewport', async () => {
    addSampleNotes(doc, 6);
    await wait();

    const notes = document.querySelectorAll('affine-edgeless-note');
    expect(notes.length).toBe(6);
  });
});
