import type {
  EdgelessRootBlockComponent,
  FrameBlockComponent,
} from '@blocksuite/blocks';

import { assertType } from '@blocksuite/global/utils';
import { Text } from '@blocksuite/store';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { addNote, getDocRootBlock } from '../utils/edgeless.js';
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
    expect(titleX).toBeCloseTo(0);
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

  test('frame should always be placed under the bottom of other blocks', async () => {
    addNote(doc, {
      xywh: '[0,0,300,300]',
      index: service.layer.generateIndex(),
    });
    addNote(doc, {
      xywh: '[100,100,300,300]',
      index: service.layer.generateIndex(),
    });
    const frameId = service.doc.addBlock(
      'affine:frame',
      {
        xywh: '[0,60,300,240]',
        title: new Text('Frame 1'),
      },
      service.surface.id
    );
    service.zoomToFit();
    await wait(500); // fit has a transition animation

    const frameTitle = document.querySelector(
      `[data-block-id="${frameId}"] .affine-frame-title`
    )!;
    const titleRect = frameTitle.getBoundingClientRect();
    const frameBody = document.querySelector(
      `[data-block-id="${frameId}"] .affine-frame-container`
    )!;
    const bodyRect = frameBody.getBoundingClientRect();

    const pointDom1 = document.elementFromPoint(
      titleRect.x + titleRect.width / 2,
      titleRect.y + titleRect.height / 2
    );
    const pointDom2 = document.elementFromPoint(
      bodyRect.x + bodyRect.width / 2,
      bodyRect.y + bodyRect.height / 2
    );

    expect(
      frameTitle.contains(pointDom1),
      'Frame title should be on top'
    ).toBeTruthy();

    expect(
      frameBody.contains(pointDom2),
      'Frame body should be on bottom'
    ).toBeFalsy();
  });

  test('frame should have externalXYWH after moving viewport to contains frame', async () => {
    const frameId = service.doc.addBlock(
      'affine:frame',
      {
        xywh: '[1800,1800,200,200]',
        title: new Text('Frame 1'),
      },
      service.surface.id
    );
    await wait();

    const frame = service.doc.getBlock(frameId);
    expect(frame).toBeTruthy();

    assertType<FrameBlockComponent>(frame);

    service.viewport.setCenter(900, 900);
    expect(frame?.model.externalXYWH).toBeDefined();
  });
});
