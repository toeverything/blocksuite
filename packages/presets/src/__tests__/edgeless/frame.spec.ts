import type { EdgelessRootBlockComponent } from '@blocksuite/blocks';

import { Text } from '@blocksuite/store';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { getDocRootBlock } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('frame', () => {
  let service!: EdgelessRootBlockComponent['service'];

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');
    service = getDocRootBlock(window.doc, window.editor, 'edgeless').service;

    return cleanup;
  });

  test('frame should have title', async () => {
    const frame = service.doc.addBlock(
      'affine:frame',
      {
        xywh: '[0,0,300,300]',
        title: new Text('Frame 1'),
      },
      service.surface.id
    );
    await wait();

    const titleDom = document.querySelector(
      `affine-frame[data-block-id="${frame}"] .affine-frame-title`
    );
    const rect = titleDom?.getBoundingClientRect();

    expect(titleDom).not.toBeNull();
    expect(rect).not.toBeNull();
    expect(rect!.width).toBeGreaterThan(0);
    expect(rect!.height).toBeGreaterThan(0);

    const [titleX, titleY] = service.viewport.toModelCoord(rect!.x, rect!.y);
    expect(titleX).toBe(0);
    expect(titleY).toBeLessThan(0);

    const nestedFrame = service.doc.addBlock(
      'affine:frame',
      {
        xywh: '[20,20,200,200]',
        title: new Text('Frame 2'),
      },
      service.surface.id
    );
    await wait();
    const nestedTitle = document.querySelector(
      `affine-frame[data-block-id="${nestedFrame}"] .affine-frame-title`
    );
    const nestedTitleRect = nestedTitle!.getBoundingClientRect()!;
    const [nestedTitleX, nestedTitleY] = service.viewport.toModelCoord(
      nestedTitleRect.x,
      nestedTitleRect.y
    );

    expect(nestedTitleX).toBeGreaterThan(20);
    expect(nestedTitleY).toBeGreaterThan(20);
  });
});
