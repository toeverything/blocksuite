import type { DocSnapshot } from '@blocksuite/store';

import {
  type EdgelessRootBlockComponent,
  EdgelessRootService,
  type FrameBlockComponent,
  type SurfaceRefBlockComponent,
} from '@blocksuite/blocks';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { addNote, getDocRootBlock } from '../utils/edgeless.js';
import { importFromSnapshot } from '../utils/misc.js';
import { setupEditor } from '../utils/setup.js';

describe('basic', () => {
  let service: EdgelessRootBlockComponent['service'];
  let edgelessRoot: EdgelessRootBlockComponent;
  let noteAId = '';
  let noteBId = '';
  let shapeAId = '';
  let shapeBId = '';
  let frameId = '';

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');
    edgelessRoot = getDocRootBlock(doc, editor, 'edgeless');
    service = edgelessRoot.service;

    noteAId = addNote(doc, {
      index: service.generateIndex('affine:note'),
    });
    shapeAId = service.addElement('shape', {
      type: 'rect',
      xywh: '[0, 0, 100, 100]',
    });
    noteBId = addNote(doc, {
      // force to be the last note
      index: service.generateIndex('shape'),
    });
    shapeBId = service.addElement('shape', {
      type: 'rect',
      xywh: '[100, 0, 100, 100]',
    });
    frameId = service.addBlock(
      'affine:frame',
      {
        xywh: '[0, 0, 800, 200]',
      },
      service.surface.id
    );

    return cleanup;
  });

  test('surface-ref should be rendered in page mode', async () => {
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: frameId,
      },
      noteAId
    );

    editor.mode = 'page';
    await wait();

    expect(
      document.querySelector(
        `affine-surface-ref[data-block-id="${surfaceRefId}"]`
      )
    ).instanceOf(Element);
  });

  test('surface-ref should be rendered as empty surface-ref-block-edgeless component page mode', async () => {
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: frameId,
      },
      noteAId
    );

    await wait();

    const refBlock = document.querySelector(
      `affine-edgeless-surface-ref[data-block-id="${surfaceRefId}"]`
    )! as HTMLElement;

    expect(refBlock).instanceOf(Element);
    expect(refBlock.innerText).toBe('');
  });

  test('content in frame should be rendered in the correct order', async () => {
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: frameId,
      },
      noteAId
    );

    editor.mode = 'page';
    await wait();

    const surfaceRef = document.querySelector(
      `affine-surface-ref[data-block-id="${surfaceRefId}"]`
    ) as HTMLElement;
    const refBlocks = Array.from(
      surfaceRef.querySelectorAll('affine-edgeless-note')
    ) as HTMLElement[];
    const stackingCanvas = Array.from(
      surfaceRef.querySelectorAll('.indexable-canvas')!
    ) as HTMLCanvasElement[];

    expect(refBlocks.length).toBe(2);
    expect(stackingCanvas.length).toBe(1);
    expect(stackingCanvas[0].style.zIndex > refBlocks[0].style.zIndex).toBe(
      true
    );
  });

  test('content in group should be rendered in the correct order', async () => {
    const groupId = service.addElement('group', {
      children: {
        [shapeAId]: true,
        [shapeBId]: true,
        [noteAId]: true,
        [noteBId]: true,
      },
    });
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: groupId,
      },
      noteAId
    );

    editor.mode = 'page';
    await wait();

    const surfaceRef = document.querySelector(
      `affine-surface-ref[data-block-id="${surfaceRefId}"]`
    ) as HTMLElement;
    const refBlocks = Array.from(
      surfaceRef.querySelectorAll('affine-edgeless-note')
    ) as HTMLElement[];
    const stackingCanvas = Array.from(
      surfaceRef.querySelectorAll('.indexable-canvas')
    ) as HTMLCanvasElement[];

    expect(refBlocks.length).toBe(2);
    expect(stackingCanvas.length).toBe(2);
    expect(stackingCanvas[1].style.zIndex > refBlocks[0].style.zIndex).toBe(
      true
    );
  });

  test('frame should be rendered in surface-ref viewport', async () => {
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: frameId,
      },
      noteAId
    );

    editor.mode = 'page';
    await wait();

    const surfaceRef = document.querySelector(
      `affine-surface-ref[data-block-id="${surfaceRefId}"]`
    ) as SurfaceRefBlockComponent;

    const edgeless = surfaceRef.previewEditor!.std.get(EdgelessRootService);

    const frame = surfaceRef.querySelector(
      'affine-frame'
    ) as FrameBlockComponent;

    expect(
      edgeless.viewport.isInViewport(frame.model.elementBound)
    ).toBeTruthy();
  });

  test('group should be rendered in surface-ref viewport', async () => {
    const groupId = service.addElement('group', {
      children: {
        [shapeAId]: true,
        [shapeBId]: true,
        [noteAId]: true,
        [noteBId]: true,
      },
    });
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: groupId,
      },
      noteAId
    );

    editor.mode = 'page';
    await wait();

    const surfaceRef = document.querySelector(
      `affine-surface-ref[data-block-id="${surfaceRefId}"]`
    ) as SurfaceRefBlockComponent;

    const edgeless = surfaceRef.previewEditor!.std.get(EdgelessRootService);

    const group = edgeless.getElementById(groupId)!;

    expect(edgeless.viewport.isInViewport(group.elementBound)).toBeTruthy();
  });

  test('viewport of surface-ref should be updated when the reference xywh updated', async () => {
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: frameId,
      },
      noteAId
    );

    editor.mode = 'page';
    await wait();

    const surfaceRef = document.querySelector(
      `affine-surface-ref[data-block-id="${surfaceRefId}"]`
    ) as SurfaceRefBlockComponent;

    const edgeless = surfaceRef.previewEditor!.std.get(EdgelessRootService);

    const frame = surfaceRef.querySelector(
      'affine-frame'
    ) as FrameBlockComponent;

    const oldViewport = edgeless.viewport.viewportBounds;

    frame.model.xywh = '[100, 100, 800, 200]';
    await wait();

    expect(edgeless.viewport.viewportBounds).not.toEqual(oldViewport);
  });

  test('view in edgeless mode button', async () => {
    const groupId = service.addElement('group', {
      children: {
        [shapeAId]: true,
        [shapeBId]: true,
        [noteAId]: true,
        [noteBId]: true,
      },
    });
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: groupId,
      },
      noteAId
    );

    editor.mode = 'page';
    await wait();

    const surfaceRef = document.querySelector(
      `affine-surface-ref[data-block-id="${surfaceRefId}"]`
    ) as HTMLElement;

    expect(surfaceRef).instanceOf(Element);
    (surfaceRef as SurfaceRefBlockComponent).viewInEdgeless();
    await wait();
  });
});

import snapshot from '../snapshots/edgeless/surface-ref.spec.ts/surface-ref.json';

describe('clipboard', () => {
  test('import surface-ref snapshot should render content correctly', async () => {
    await setupEditor('page');

    const pageRoot = getDocRootBlock(doc, editor, 'page');
    const pageRootService = pageRoot.service;

    const newDoc = await importFromSnapshot(
      pageRootService.collection,
      snapshot as DocSnapshot
    );
    expect(newDoc).toBeTruthy();

    editor.doc = newDoc!;
    await wait();

    const surfaceRefs = newDoc!.getBlocksByFlavour('affine:surface-ref');
    expect(surfaceRefs).toHaveLength(2);

    const surfaceRefBlocks = surfaceRefs.map(({ id }) =>
      editor.std.view.getBlock(id)
    ) as SurfaceRefBlockComponent[];

    expect(surfaceRefBlocks[0].querySelector('.ref-placeholder')).toBeFalsy();
    expect(surfaceRefBlocks[1].querySelector('.ref-placeholder')).toBeFalsy();
  });
});
