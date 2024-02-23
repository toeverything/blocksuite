/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type {
  EdgelessPageBlockComponent,
  ElementModel,
  NoteBlockModel,
} from '@blocksuite/blocks';
import type { BlockElement } from '@blocksuite/lit';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { addNote, getPageRootBlock, getSurface } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

let service!: EdgelessPageBlockComponent['service'];

beforeEach(async () => {
  const cleanup = await setupEditor('edgeless');
  service = getPageRootBlock(window.page, window.editor, 'edgeless').service;

  return async () => {
    await wait(100);
    cleanup();
  };
});

test('layer manager inital state', () => {
  expect(service.layer).toBeDefined();
  expect(service.layer.layers.length).toBe(0);
  expect(service.layer.canvasLayers.length).toBe(1);
});

test('new added frame should not affect layer', async () => {
  service.addBlock(
    'affine:frame',
    {
      xywh: '[0, 0, 100, 100]',
    },
    service.surface
  );

  await wait();

  expect(service.layer.layers.length).toBe(0);
  expect(service.layer.canvasLayers.length).toBe(1);
});

test('add new edgeless blocks or canvas elements should update layer automatically', async () => {
  addNote(page);

  service.addElement('shape', {
    shapeType: 'rect',
  });

  await wait();

  expect(service.layer.layers.length).toBe(2);
});

test('delete element should update layer automatically', () => {
  const id = addNote(page);
  const canvasElId = service.addElement('shape', {
    shapeType: 'rect',
  });

  service.removeElement(id);

  expect(service.layer.layers.length).toBe(1);

  service.removeElement(canvasElId);

  expect(service.layer.layers.length).toBe(0);
});

test('change element should update layer automatically', async () => {
  const id = addNote(page);
  const canvasElId = service.addElement('shape', {
    shapeType: 'rect',
  });

  await wait();

  service.updateElement(id, {
    index: service.layer.getReorderedIndex(
      service.getElementById(id)!,
      'forward'
    ),
  });
  expect(service.layer.layers[service.layer.layers.length - 1].type).toBe(
    'block'
  );

  service.updateElement(canvasElId, {
    index: service.layer.getReorderedIndex(
      service.getElementById(canvasElId)!,
      'forward'
    ),
  });
  expect(service.layer.layers[service.layer.layers.length - 1].type).toBe(
    'canvas'
  );
});

test('new added notes should be placed under the topmost canvas layer', async () => {
  service.addElement('shape', {
    shapeType: 'rect',
  });
  service.addElement('shape', {
    shapeType: 'rect',
  });
  addNote(page, {
    index: service.layer.generateIndex('affine:note'),
  });
  addNote(page, {
    index: service.layer.generateIndex('affine:note'),
  });
  addNote(page, {
    index: service.layer.generateIndex('affine:note'),
  });

  await wait();

  expect(service.layer.layers.length).toBe(2);
  expect(service.layer.layers[1].type).toBe('canvas');
});

test('new added canvas elements should be placed in the topmost canvas layer', async () => {
  addNote(page);
  service.addElement('shape', {
    shapeType: 'rect',
  });

  await wait();

  expect(service.layer.layers.length).toBe(2);
  expect(service.layer.layers[1].type).toBe('canvas');
});

test("there should be at lease one layer in canvasLayers property even there's no canvas element", () => {
  addNote(page);

  expect(service.layer.canvasLayers.length).toBe(1);
});

test('if the topmost layer is canvas layer, the number of layers in the canvasLayers prop should has the same with the number of canvas layer in the layers prop', () => {
  addNote(page);
  service.addElement('shape', {
    shapeType: 'rect',
  });
  addNote(page, {
    index: service.layer.generateIndex('shape'),
  });
  service.addElement('shape', {
    shapeType: 'rect',
  });

  expect(service.layer.layers.length).toBe(4);
  expect(service.layer.canvasLayers.length).toBe(
    service.layer.layers.filter(layer => layer.type === 'canvas').length
  );
});

test('a new layer should be created in canvasLayers prop when the topmost layer is not canvas layer', () => {
  service.addElement('shape', {
    shapeType: 'rect',
  });
  addNote(page, {
    index: service.layer.generateIndex('shape'),
  });
  service.addElement('shape', {
    shapeType: 'rect',
  });
  addNote(page, {
    index: service.layer.generateIndex('shape'),
  });

  expect(service.layer.canvasLayers.length).toBe(3);
});

describe('layer reorder functionality', () => {
  let ids: string[] = [];

  beforeEach(() => {
    ids = [
      service.addElement('shape', {
        shapeType: 'rect',
      }),
      addNote(page, {
        index: service.layer.generateIndex('shape'),
      }),
      service.addElement('shape', {
        shapeType: 'rect',
      }),
      addNote(page, {
        index: service.layer.generateIndex('shape'),
      }),
    ];
  });

  test('forward', async () => {
    service.updateElement(ids[0], {
      index: service.layer.getReorderedIndex(
        service.getElementById(ids[0])!,
        'forward'
      ),
    });

    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[0]) as any)
      )
    ).toBe(1);
    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[1]) as any)
      )
    ).toBe(0);

    await wait();

    service.updateElement(ids[1], {
      index: service.layer.getReorderedIndex(
        service.getElementById(ids[1])!,
        'forward'
      ),
    });

    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[0]) as any)
      )
    ).toBe(0);
    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[1]) as any)
      )
    ).toBe(1);
  });

  test('front', async () => {
    service.updateElement(ids[0], {
      index: service.layer.getReorderedIndex(
        service.getElementById(ids[0])!,
        'front'
      ),
    });

    await wait();

    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[0]) as any)
      )
    ).toBe(3);

    service.updateElement(ids[1], {
      index: service.layer.getReorderedIndex(
        service.getElementById(ids[1])!,
        'front'
      ),
    });

    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[1]) as any)
      )
    ).toBe(3);
  });

  test('backward', async () => {
    service.updateElement(ids[3], {
      index: service.layer.getReorderedIndex(
        service.getElementById(ids[3])!,
        'backward'
      ),
    });

    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[3]) as any)
      )
    ).toBe(1);
    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[2]) as any)
      )
    ).toBe(2);

    await wait();

    service.updateElement(ids[2], {
      index: service.layer.getReorderedIndex(
        service.getElementById(ids[2])!,
        'backward'
      ),
    });

    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[3]) as any)
      )
    ).toBe(3);
    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[2]) as any)
      )
    ).toBe(2);
  });

  test('back', async () => {
    service.updateElement(ids[3], {
      index: service.layer.getReorderedIndex(
        service.getElementById(ids[3])!,
        'back'
      ),
    });

    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[3]) as any)
      )
    ).toBe(0);

    await wait();

    service.updateElement(ids[2], {
      index: service.layer.getReorderedIndex(
        service.getElementById(ids[2])!,
        'back'
      ),
    });

    expect(
      service.layer.layers.findIndex(layer =>
        layer.set.has(service.getElementById(ids[2]) as any)
      )
    ).toBe(0);
  });
});

test('indexed canvas should be inserted into edgeless portal when switch to edgeless mode', async () => {
  let surface = getSurface(page, editor);

  service.addElement('shape', {
    shapeType: 'rect',
  });

  addNote(page, {
    index: service.layer.generateIndex('shape'),
  });

  await wait();

  service.addElement('shape', {
    shapeType: 'rect',
  });

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

  const edgeless = getPageRootBlock(page, editor, 'edgeless');
  const blocks = Array.from(
    edgeless.pageBlockContainer.layer.querySelectorAll('[data-portal-block-id]')
  ) as BlockElement[];

  expect(blocks.length).toBe(indexes.length);
  blocks.forEach((block, index) => {
    if (index === blocks.length - 1) return;

    const prevModel = block.model;
    const model = blocks[index + 1].model;

    expect(
      service.layer.compare(prevModel as any, model as any)
    ).toBeLessThanOrEqual(0);
  });
});

describe('index generator', () => {
  let preinsertedShape: ElementModel;
  let preinsertedNote: NoteBlockModel;

  beforeEach(() => {
    const shapeId = service.addElement('shape', {
      shapeType: 'rect',
    });
    const noteId = addNote(page, {
      index: service.layer.generateIndex('affine:block'),
    });

    preinsertedShape = service.getElementById(shapeId)! as ElementModel;
    preinsertedNote = service.getElementById(noteId)! as NoteBlockModel;
  });

  test('generator should remember the index it generated', () => {
    const generator = service.layer.createIndexGenerator();

    const indexA = generator('shape');
    const indexB = generator('shape');
    const blockIndex = generator('affine:block');

    expect(indexA > preinsertedShape.index).toBe(true);
    expect(indexB).not.toBe(indexA);
    expect(indexB > indexA).toBe(true);
    expect(blockIndex > preinsertedNote.index).toBe(true);
    expect(blockIndex < indexA).toBe(true);
  });

  test('generator can generate incrementing indices regardless the element type', () => {
    const generator = service.layer.createIndexGenerator(true);

    const indexA = generator('shape');
    const indexB = generator('shape');
    const blockIndexA = generator('affine:block');
    const blockIndexB = generator('affine:block');

    expect(indexA > preinsertedShape.index).toBe(true);
    expect(indexB > indexA).toBe(true);
    expect(blockIndexA > indexB).toBe(true);
    expect(blockIndexB > blockIndexA).toBe(true);
  });
});
