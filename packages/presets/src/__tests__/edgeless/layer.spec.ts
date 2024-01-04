/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { BlockElement } from '@blocksuite/lit';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import {
  addElement,
  addNote,
  getPageRootBlock,
  getSurface,
} from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

beforeEach(async () => {
  const cleanup = await setupEditor('edgeless');

  return cleanup;
});

test('layer manager inital state', () => {
  const surface = getSurface(window.page, window.editor);

  expect(surface.layer).toBeDefined();
  expect(surface.layer.layers.length).toBe(0);
  expect(surface.layer.canvasLayers.length).toBe(1);
});

test('new added frame should not affect layer', async () => {
  const surface = getSurface(window.page, window.editor);

  surface.addElement(
    'affine:frame',
    {
      xywh: '[0, 0, 100, 100]',
    },
    surface.model
  );

  await wait();

  expect(surface.layer.layers.length).toBe(0);
  expect(surface.layer.canvasLayers.length).toBe(1);
});

test('add new edgeless blocks or canvas elements should update layer automatically', async () => {
  const surface = getSurface(window.page, window.editor);

  addNote(page);
  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );

  await wait();

  expect(surface.layer.layers.length).toBe(2);
});

test('delete element should update layer automatically', async () => {
  const surface = getSurface(window.page, window.editor);

  const id = addNote(page);
  const canvasElId = addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );

  surface.removeElement(id);

  expect(surface.layer.layers.length).toBe(1);

  surface.removeElement(canvasElId);

  expect(surface.layer.layers.length).toBe(0);
});

test('change element should update layer automatically', async () => {
  const surface = getSurface(window.page, window.editor);

  const id = addNote(page);
  const canvasElId = addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );

  await wait();

  surface.updateElement(id, {
    index: surface.layer.getReorderedIndex(surface.pickById(id)!, 'forward'),
  });
  expect(surface.layer.layers[surface.layer.layers.length - 1].type).toBe(
    'block'
  );

  surface.updateElement(canvasElId, {
    index: surface.layer.getReorderedIndex(
      surface.pickById(canvasElId)!,
      'forward'
    ),
  });
  expect(surface.layer.layers[surface.layer.layers.length - 1].type).toBe(
    'canvas'
  );
});

test('new added notes should be placed under the topmost canvas layer', async () => {
  const surface = getSurface(window.page, window.editor);

  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );
  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );
  addNote(page, {
    index: surface.layer.generateIndex('affine:note'),
  });
  addNote(page, {
    index: surface.layer.generateIndex('affine:note'),
  });
  addNote(page, {
    index: surface.layer.generateIndex('affine:note'),
  });

  await wait();

  expect(surface.layer.layers.length).toBe(2);
  expect(surface.layer.layers[1].type).toBe('canvas');
});

test('new added canvas elements should be placed in the topmost canvas layer', async () => {
  const surface = getSurface(window.page, window.editor);

  addNote(page);
  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );

  await wait();

  expect(surface.layer.layers.length).toBe(2);
  expect(surface.layer.layers[1].type).toBe('canvas');
});

test("there should be at lease one layer in canvasLayers property even there's no canvas element", () => {
  const surface = getSurface(window.page, window.editor);

  addNote(page);

  expect(surface.layer.canvasLayers.length).toBe(1);
});

test('if the topmost layer is canvas layer, the number of layers in the canvasLayers prop should has the same with the number of canvas layer in the layers prop', () => {
  const surface = getSurface(window.page, window.editor);

  addNote(page);
  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );
  addNote(page, {
    // pass 'shape' to generateIndex to make sure the index is on the topmost layer
    index: surface.layer.generateIndex('shape'),
  });
  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );

  expect(surface.layer.layers.length).toBe(4);
  expect(surface.layer.canvasLayers.length).toBe(
    surface.layer.layers.filter(layer => layer.type === 'canvas').length
  );
});

test('a new layer should be created in canvasLayers prop when the topmost layer is not canvas layer', () => {
  const surface = getSurface(window.page, window.editor);

  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );
  addNote(page, {
    // pass 'shape' to generateIndex to make sure the index is on the topmost layer
    index: surface.layer.generateIndex('shape'),
  });
  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );
  addNote(page, {
    // pass 'shape' to generateIndex to make sure the index is on the topmost layer
    index: surface.layer.generateIndex('shape'),
  });

  expect(surface.layer.canvasLayers.length).toBe(3);
});

describe('layer reorder functionality', () => {
  let ids: string[] = [];

  beforeEach(() => {
    const surface = getSurface(window.page, window.editor);

    ids = [
      addElement(
        'shape',
        {
          shapeType: 'rect',
        },
        surface
      ),
      addNote(page, {
        // pass 'shape' to generateIndex to make sure the index is on the topmost layer
        index: surface.layer.generateIndex('shape'),
      }),
      addElement(
        'shape',
        {
          shapeType: 'rect',
        },
        surface
      ),
      addNote(page, {
        // pass 'shape' to generateIndex to make sure the index is on the topmost layer
        index: surface.layer.generateIndex('shape'),
      }),
    ];
  });

  test('forward', async () => {
    const surface = getSurface(window.page, window.editor);

    surface.updateElement(ids[0], {
      index: surface.layer.getReorderedIndex(
        surface.pickById(ids[0])!,
        'forward'
      ),
    });

    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[0]) as any)
      )
    ).toBe(1);
    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[1]) as any)
      )
    ).toBe(0);

    await wait();

    surface.updateElement(ids[1], {
      index: surface.layer.getReorderedIndex(
        surface.pickById(ids[1])!,
        'forward'
      ),
    });

    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[0]) as any)
      )
    ).toBe(0);
    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[1]) as any)
      )
    ).toBe(1);
  });

  test('front', async () => {
    const surface = getSurface(window.page, window.editor);

    surface.updateElement(ids[0], {
      index: surface.layer.getReorderedIndex(
        surface.pickById(ids[0])!,
        'front'
      ),
    });

    await wait();

    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[0]) as any)
      )
    ).toBe(3);

    surface.updateElement(ids[1], {
      index: surface.layer.getReorderedIndex(
        surface.pickById(ids[1])!,
        'front'
      ),
    });

    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[1]) as any)
      )
    ).toBe(3);
  });

  test('backward', async () => {
    const surface = getSurface(window.page, window.editor);

    surface.updateElement(ids[3], {
      index: surface.layer.getReorderedIndex(
        surface.pickById(ids[3])!,
        'backward'
      ),
    });

    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[3]) as any)
      )
    ).toBe(1);
    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[2]) as any)
      )
    ).toBe(2);

    await wait();

    surface.updateElement(ids[2], {
      index: surface.layer.getReorderedIndex(
        surface.pickById(ids[2])!,
        'backward'
      ),
    });

    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[3]) as any)
      )
    ).toBe(3);
    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[2]) as any)
      )
    ).toBe(2);
  });

  test('back', async () => {
    const surface = getSurface(window.page, window.editor);

    surface.updateElement(ids[3], {
      index: surface.layer.getReorderedIndex(surface.pickById(ids[3])!, 'back'),
    });

    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[3]) as any)
      )
    ).toBe(0);

    await wait();

    surface.updateElement(ids[2], {
      index: surface.layer.getReorderedIndex(surface.pickById(ids[2])!, 'back'),
    });

    expect(
      surface.layer.layers.findIndex(layer =>
        layer.set.has(surface.pickById(ids[2]) as any)
      )
    ).toBe(0);
  });
});

test('indexed canvas should be inserted into edgeless portal when switch to edgeless mode', async () => {
  let surface = getSurface(page, editor);

  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );

  addNote(page, {
    // pass 'shape' to generateIndex to make sure the index is on the topmost layer
    index: surface.layer.generateIndex('shape'),
  });

  await wait();

  addElement(
    'shape',
    {
      shapeType: 'rect',
    },
    surface
  );

  editor.mode = 'page';
  await wait();
  editor.mode = 'edgeless';
  await wait();

  surface = getSurface(page, editor);
  expect(
    getSurface(page, editor).edgeless.pageBlockContainer.canvasSlot.children
      .length
  ).toBe(1);

  const indexedCanvas = getSurface(page, editor).edgeless.pageBlockContainer
    .canvasSlot.children[0] as HTMLCanvasElement;

  expect(indexedCanvas.width).toBe(surface.renderer.canvas.width);
  expect(indexedCanvas.height).toBe(surface.renderer.canvas.height);
  expect(indexedCanvas.width).not.toBe(0);
  expect(indexedCanvas.height).not.toBe(0);
});

test('the actual rendering order of blocks should satisfy the logic order of their indexes', async () => {
  editor.mode = 'page';

  await wait();

  const indexes = [
    'ao',
    'b0D',
    'ar',
    'as',
    'at',
    'au',
    'av',
    'b0Y',
    'b0V',
    'b0H',
    'b0M',
    'b0T',
    'b0f',
    'b0fV',
    'b0g',
    'b0i',
    'b0fl',
  ];

  indexes.forEach(index => {
    addNote(page, {
      index,
    });
  });

  await wait();

  editor.mode = 'edgeless';
  await wait();

  const surface = getSurface(page, editor);
  const edgeless = getPageRootBlock(page, editor, 'edgeless');
  const blocks = Array.from(
    edgeless.pageBlockContainer.layer.querySelectorAll('[data-portal-block-id]')
  ) as BlockElement[];

  expect(blocks.length).toBe(indexes.length);
  blocks.forEach((block, index) => {
    if (index === blocks.length - 1) return;

    const prevModel = block.model;
    const model = blocks[index + 1].model;

    expect(surface.compare(prevModel as any, model as any)).toBeLessThanOrEqual(
      0
    );
  });
});
