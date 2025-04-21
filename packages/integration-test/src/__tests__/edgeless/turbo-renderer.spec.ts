/**
 * Please refer to integration-test/README.md for commands to run tests.
 */
import { ParagraphLayoutHandlerExtension } from '@blocksuite/affine/blocks/paragraph';
import { noop } from '@blocksuite/affine/global/utils';
import {
  TurboRendererConfigFactory,
  ViewportTurboRendererExtension,
} from '@blocksuite/affine-gfx-turbo-renderer';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { addSampleNotes } from '../utils/doc-generator.js';
import {
  createPainterWorker,
  getRenderer,
  setupEditor,
} from '../utils/setup.js';

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

  test('should access turbo renderer instance', async () => {
    const renderer = getRenderer();
    expect(renderer).toBeDefined();
    expect(renderer instanceof ViewportTurboRendererExtension).toBe(true);
    expect(renderer.canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  test('initial state should be pending', async () => {
    const renderer = getRenderer();
    expect(renderer.state$.value).toBe('pending');
  });

  test('zooming should change state to zooming', async () => {
    const renderer = getRenderer();
    renderer.viewport.zooming$.next(true);
    await wait();
    expect(renderer.state$.value).toBe('zooming');
    renderer.viewport.zooming$.next(false);
    await wait();
    expect(renderer.state$.value).not.toBe('zooming');
  });

  test('state transitions between pending and ready', async () => {
    const renderer = getRenderer();

    // Initial state should be pending after adding content
    addSampleNotes(doc, 1);
    await wait(100); // Short wait for initial processing
    expect(renderer.state$.value).toBe('pending');

    // Ensure zooming is off and wait for debounce + buffer
    renderer.viewport.zooming$.next(false);
    await wait(renderer.options.debounceTime + 500);
    expect(renderer.state$.value).toBe('ready');
  });

  test('initial layout cache data should be null', () => {
    const renderer = getRenderer();
    expect(renderer.layoutCacheData).toBeNull();
  });

  test('invalidation should reset layout cache data to null', async () => {
    const renderer = getRenderer();
    addSampleNotes(doc, 1);
    await wait(100);

    // Access getter to populate cache
    const _cache = renderer.layoutCache;
    noop(_cache);
    expect(renderer.layoutCacheData).not.toBeNull();

    // Invalidate
    addSampleNotes(doc, 1);
    await wait(100);

    expect(renderer.layoutCacheData).toBeNull();
  });

  test('accessing layoutCache getter should populate cache data', async () => {
    const renderer = getRenderer();
    addSampleNotes(doc, 1);
    await wait();
    expect(renderer.layoutCacheData).toBeNull(); // Check internal state before access

    const _cache = renderer.layoutCache; // Access getter to populate cache
    noop(_cache);
    expect(renderer.layoutCacheData).not.toBeNull(); // Check internal state after access
    expect(renderer.layoutCache?.roots.length).toBeGreaterThan(0); // Check public getter result
  });
});
