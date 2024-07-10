/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { BlockElement } from '@blocksuite/block-std';
import {
  type EdgelessRootBlockComponent,
  generateKeyBetween,
  type NoteBlockModel,
} from '@blocksuite/blocks';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { addNote, getDocRootBlock, getSurface } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

let service!: EdgelessRootBlockComponent['service'];

beforeEach(async () => {
  const cleanup = await setupEditor('edgeless');
  service = getDocRootBlock(window.doc, window.editor, 'edgeless').service;

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
  addNote(doc);

  service.addElement('shape', {
    shapeType: 'rect',
  });

  await wait();

  expect(service.layer.layers.length).toBe(2);
});

test('delete element should update layer automatically', () => {
  const id = addNote(doc);
  const canvasElId = service.addElement('shape', {
    shapeType: 'rect',
  });

  service.removeElement(id);

  expect(service.layer.layers.length).toBe(1);

  service.removeElement(canvasElId);

  expect(service.layer.layers.length).toBe(0);
});

test('change element should update layer automatically', async () => {
  const id = addNote(doc);
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

test('new added block should be placed under the topmost canvas layer', async () => {
  service.addElement('shape', {
    shapeType: 'rect',
  });
  service.addElement('shape', {
    shapeType: 'rect',
  });
  addNote(doc, {
    index: service.layer.generateIndex('affine:note'),
  });
  addNote(doc, {
    index: service.layer.generateIndex('affine:note'),
  });
  addNote(doc, {
    index: service.layer.generateIndex('affine:note'),
  });

  await wait();

  expect(service.layer.layers.length).toBe(2);
  expect(service.layer.layers[1].type).toBe('canvas');
});

test('new added canvas elements should be placed in the topmost canvas layer', async () => {
  addNote(doc);
  service.addElement('shape', {
    shapeType: 'rect',
  });

  await wait();

  expect(service.layer.layers.length).toBe(2);
  expect(service.layer.layers[1].type).toBe('canvas');
});

test("there should be at lease one layer in canvasLayers property even there's no canvas element", () => {
  addNote(doc);

  expect(service.layer.canvasLayers.length).toBe(1);
});

test('if the topmost layer is canvas layer, the length of canvasLayers array should equal to the counts of canvas layers', () => {
  addNote(doc);
  service.addElement('shape', {
    shapeType: 'rect',
  });
  addNote(doc, {
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
  addNote(doc, {
    index: service.layer.generateIndex('shape'),
  });
  service.addElement('shape', {
    shapeType: 'rect',
  });
  addNote(doc, {
    index: service.layer.generateIndex('shape'),
  });

  expect(service.layer.canvasLayers.length).toBe(3);
});

test('layer zindex should update correctly when elements changed', async () => {
  addNote(doc, {
    index: service.layer.generateIndex('affine:note'),
  });
  const noteId = addNote(doc, {
    index: service.layer.generateIndex('affine:note'),
  });
  const note = service.getElementById(noteId);
  addNote(doc, {
    index: service.layer.generateIndex('affine:note'),
  });
  service.addElement('shape', {
    shapeType: 'rect',
  });
  const topShapeId = service.addElement('shape', {
    shapeType: 'rect',
  });
  const topShape = service.getElementById(topShapeId);

  await wait();

  const assertInitialState = () => {
    expect(service.layer.layers[0].type).toBe('block');
    expect(service.layer.layers[0].zIndex).toBe(1);

    expect(service.layer.layers[1].type).toBe('canvas');
    expect(service.layer.layers[1].zIndex).toBe(4);
  };
  assertInitialState();

  service.doc.captureSync();

  service.updateElement(noteId, {
    index: service.layer.getReorderedIndex(note!, 'front'),
  });
  await wait();
  service.doc.captureSync();

  const assert2StepState = () => {
    expect(service.layer.layers[1].type).toBe('canvas');
    expect(service.layer.layers[1].zIndex).toBe(3);

    expect(service.layer.layers[2].type).toBe('block');
    expect(service.layer.layers[2].zIndex).toBe(4);
  };
  assert2StepState();

  service.updateElement(topShapeId, {
    index: service.layer.getReorderedIndex(topShape!, 'front'),
  });
  await wait();
  service.doc.captureSync();

  expect(service.layer.layers[3].type).toBe('canvas');
  expect(service.layer.layers[3].zIndex).toBe(5);

  service.doc.undo();
  await wait();
  assert2StepState();

  service.doc.undo();
  await wait();
  assertInitialState();
});

test('blocks should rerender when their z-index changed', async () => {
  const blocks = [
    addNote(doc, {
      index: service.layer.generateIndex('affine:note'),
    }),
    addNote(doc, {
      index: service.layer.generateIndex('affine:note'),
    }),
    addNote(doc, {
      index: service.layer.generateIndex('affine:note'),
    }),
    addNote(doc, {
      index: service.layer.generateIndex('affine:note'),
    }),
  ];
  const assertBlockElementsContent = () => {
    const blockElements = Array.from(
      document.querySelectorAll(
        '.affine-edgeless-layer > edgeless-block-portal-note'
      )
    );

    expect(blockElements.length).toBe(4);

    blockElements.forEach(element => {
      expect(element.children.length).toBeGreaterThan(0);
    });
  };

  await wait();
  assertBlockElementsContent();

  service.addElement('shape', {
    shapeType: 'rect',
    index: generateKeyBetween(
      service.getElementById(blocks[1])!.index,
      service.getElementById(blocks[2])!.index
    ),
  });

  await wait();
  assertBlockElementsContent();
});

describe('layer reorder functionality', () => {
  let ids: string[] = [];

  beforeEach(() => {
    ids = [
      service.addElement('shape', {
        shapeType: 'rect',
      }),
      addNote(doc, {
        index: service.layer.generateIndex('shape'),
      }),
      service.addElement('shape', {
        shapeType: 'rect',
      }),
      addNote(doc, {
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
  let surface = getSurface(doc, editor);

  service.addElement('shape', {
    shapeType: 'rect',
  });

  addNote(doc, {
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

  surface = getSurface(doc, editor);
  expect(
    getSurface(doc, editor).edgeless.rootElementContainer.canvasSlot.children
      .length
  ).toBe(1);

  const indexedCanvas = getSurface(doc, editor).edgeless.rootElementContainer
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
    addNote(doc, {
      index,
    });
  });

  await wait();

  editor.mode = 'edgeless';
  await wait(500);

  const edgeless = getDocRootBlock(doc, editor, 'edgeless');
  const blocks = Array.from(
    edgeless.rootElementContainer.layer.querySelectorAll(
      '[data-portal-block-id]'
    )
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
  let preinsertedShape: BlockSuite.SurfaceElementModelType;
  let preinsertedNote: NoteBlockModel;

  beforeEach(() => {
    const shapeId = service.addElement('shape', {
      shapeType: 'rect',
    });
    const noteId = addNote(doc, {
      index: service.layer.generateIndex('affine:block'),
    });

    preinsertedShape = service.getElementById(
      shapeId
    )! as BlockSuite.SurfaceElementModelType;
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
