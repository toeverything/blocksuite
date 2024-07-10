import type {
  EdgelessRootBlockComponent,
  SurfaceRefBlockComponent,
} from '@blocksuite/blocks';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { wait } from '../utils/common.js';
import { addNote, getDocRootBlock } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('basic', () => {
  let service: EdgelessRootBlockComponent['service'];
  let edgelessRoot: EdgelessRootBlockComponent;
  let noteA = '';
  let noteB = '';
  let shapeA = '';
  let shapeB = '';
  let frame = '';

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');
    edgelessRoot = getDocRootBlock(doc, editor, 'edgeless');
    service = edgelessRoot.service;

    noteA = addNote(doc, {
      index: service.generateIndex('affine:note'),
    });
    shapeA = service.addElement('shape', {
      type: 'rect',
      xywh: '[0, 0, 100, 100]',
    });
    noteB = addNote(doc, {
      // force to be the last note
      index: service.generateIndex('shape'),
    });
    shapeB = service.addElement('shape', {
      type: 'rect',
      xywh: '[100, 0, 100, 100]',
    });
    frame = service.addBlock(
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
        reference: frame,
      },
      noteA
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
        reference: frame,
      },
      noteA
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
        reference: frame,
      },
      noteA
    );

    editor.mode = 'page';
    await wait();

    const surfaceRef = document.querySelector(
      `affine-surface-ref[data-block-id="${surfaceRefId}"]`
    ) as HTMLElement;
    const refBlocks = Array.from(
      surfaceRef.querySelectorAll('surface-ref-note-portal')
    );
    const stackingCanvas = Array.from(
      surfaceRef.querySelector('.stacking-canvas')!.children
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
        [shapeA]: true,
        [shapeB]: true,
        [noteA]: true,
        [noteB]: true,
      },
    });
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: groupId,
      },
      noteA
    );

    editor.mode = 'page';
    await wait();

    const surfaceRef = document.querySelector(
      `affine-surface-ref[data-block-id="${surfaceRefId}"]`
    ) as HTMLElement;
    const refBlocks = Array.from(
      surfaceRef.querySelectorAll('surface-ref-note-portal')
    );
    const stackingCanvas = Array.from(
      surfaceRef.querySelector('.stacking-canvas')!.children
    ) as HTMLCanvasElement[];

    expect(refBlocks.length).toBe(2);
    expect(stackingCanvas.length).toBe(2);
    expect(stackingCanvas[1].style.zIndex > refBlocks[0].style.zIndex).toBe(
      true
    );
  });

  test('view in edgeless mode button', async () => {
    const groupId = service.addElement('group', {
      children: {
        [shapeA]: true,
        [shapeB]: true,
        [noteA]: true,
        [noteB]: true,
      },
    });
    const surfaceRefId = doc.addBlock(
      'affine:surface-ref',
      {
        reference: groupId,
      },
      noteA
    );

    editor.mode = 'page';
    await wait();

    const surfaceRef = document.querySelector(
      `affine-surface-ref[data-block-id="${surfaceRefId}"]`
    ) as HTMLElement;

    const switchEditor = vi.fn(() => {});
    const pageService = editor.host.std.spec.getService('affine:page');
    pageService.docModeService.onModeChange(switchEditor);

    expect(surfaceRef).instanceOf(Element);
    (surfaceRef as SurfaceRefBlockComponent).viewInEdgeless();
    expect(switchEditor).toBeCalledWith('edgeless');
    await wait();
  });
});
