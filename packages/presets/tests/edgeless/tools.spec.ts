import type {
  EdgelessPageBlockComponent,
  SurfaceBlockComponent,
} from '@blocksuite/blocks';
import type {} from '@blocksuite/blocks';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { click, drag } from '../utils/common.js';
import { getPageRootBlock, getSurface } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('default tool', () => {
  let surface!: SurfaceBlockComponent;
  let edgeless!: EdgelessPageBlockComponent;

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');

    edgeless = getPageRootBlock(page, editor, 'edgeless');
    surface = getSurface(window.page, window.editor);

    edgeless.tools.edgelessTool = {
      type: 'default',
    };

    return cleanup;
  });

  test('element click selection', async () => {
    const id = surface.addElement('shape', {
      shapeType: 'rect',
      xywh: '[0,0,100,100]',
      fillColor: 'red',
    });

    await wait();

    surface.viewport.setViewport(1, [1280 / 2, 1280 / 2]);

    click(edgeless.host, { x: 0, y: 50 });

    expect(edgeless.selectionManager.state.elements).toEqual([id]);
  });

  test('element drag move', async () => {
    const id = surface.addElement('shape', {
      shapeType: 'rect',
      xywh: '[0,0,100,100]',
      fillColor: 'red',
    });
    await wait();

    surface.viewport.setViewport(1, [1280 / 2, 1280 / 2]);
    await wait();

    click(edgeless.host, { x: 0, y: 50 });
    drag(edgeless.host, { x: 0, y: 50 }, { x: 0, y: 150 });
    await wait();

    const element = surface.pickById(id)!;
    expect(element?.xywh).toEqual(`[0,100,100,100]`);
  });
});
