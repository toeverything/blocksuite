/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { BlockComponent } from '@blocksuite/block-std';

import {
  type EdgelessRootBlockComponent,
  type NoteBlockModel,
  generateKeyBetween,
} from '@blocksuite/blocks';
import { type BlockModel, DocCollection } from '@blocksuite/store';
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
  const assertBlocksContent = () => {
    const blocks = Array.from(
      document.querySelectorAll(
        'affine-edgeless-root gfx-viewport > [data-block-id]'
      )
    );

    expect(blocks.length).toBe(5);

    blocks.forEach(element => {
      expect(element.children.length).toBeGreaterThan(0);
    });
  };

  await wait();
  assertBlocksContent();

  service.addElement('shape', {
    shapeType: 'rect',
    index: generateKeyBetween(
      service.getElementById(blocks[1])!.index,
      service.getElementById(blocks[2])!.index
    ),
  });

  await wait();
  assertBlocksContent();
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

describe('group related functionality', () => {
  const createGroup = (
    service: EdgelessRootBlockComponent['service'],
    childIds: string[]
  ) => {
    const children = new DocCollection.Y.Map<boolean>();
    childIds.forEach(id => children.set(id, true));

    return service.addElement('group', {
      children,
    });
  };

  test("new added group should effect it children's layer", async () => {
    const edgeless = getDocRootBlock(doc, editor, 'edgeless');
    const elements = [
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
      service.addElement('shape', {
        shapeType: 'rect',
      }),
    ];

    await wait(0);
    expect(
      edgeless.querySelectorAll<HTMLCanvasElement>('.indexable-canvas').length
    ).toBe(2);

    Array.from(
      edgeless.querySelectorAll<HTMLCanvasElement>('.indexable-canvas')
    ).forEach(canvas => {
      const rect = canvas.getBoundingClientRect();

      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
    });

    createGroup(
      service,
      elements.filter((_, idx) => idx !== 1 && idx !== 3)
    );

    expect(service.layer.layers.length).toBe(2);

    expect(service.layer.layers[0].type).toBe('block');
    expect(service.layer.layers[0].set.size).toBe(2);

    expect(service.layer.layers[1].type).toBe('canvas');
    expect(service.layer.layers[1].set.size).toBe(4);

    expect(
      edgeless.querySelectorAll<HTMLCanvasElement>('.indexable-canvas').length
    ).toBe(0);

    const topCanvas = edgeless.querySelector(
      'affine-surface canvas'
    ) as HTMLCanvasElement;

    expect(
      Number(
        (
          edgeless.querySelector(
            `[data-block-id="${elements[1]}"]`
          ) as HTMLElement
        ).style.zIndex
      )
    ).toBeLessThan(Number(topCanvas.style.zIndex));
    expect(
      Number(
        (
          edgeless.querySelector(
            `[data-block-id="${elements[3]}"]`
          ) as HTMLElement
        ).style.zIndex
      )
    ).toBeLessThan(Number(topCanvas.style.zIndex));
  });

  test("change group index should update its children's layer", () => {
    const elements = [
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
      service.addElement('shape', {
        shapeType: 'rect',
      }),
    ];

    const groupId = createGroup(
      service,
      elements.filter((_, idx) => idx !== 1 && idx !== 3)
    );
    const group = service.getElementById(groupId)!;

    expect(service.layer.layers.length).toBe(2);

    group.index = service.layer.getReorderedIndex(group, 'back');
    expect(service.layer.layers[0].type).toBe('canvas');
    expect(service.layer.layers[0].set.size).toBe(4);
    expect(service.layer.layers[0].elements[0]).toBe(group);

    group.index = service.layer.getReorderedIndex(group, 'front');
    expect(service.layer.layers[1].type).toBe('canvas');
    expect(service.layer.layers[1].set.size).toBe(4);
    expect(service.layer.layers[1].elements[0]).toBe(group);
  });
});

describe('compare function', () => {
  const SORT_ORDER = {
    AFTER: 1,
    BEFORE: -1,
    SAME: 0,
  };
  const createGroup = (
    service: EdgelessRootBlockComponent['service'],
    childIds: string[]
  ) => {
    const children = new DocCollection.Y.Map<boolean>();
    childIds.forEach(id => children.set(id, true));

    return service.addElement('group', {
      children,
    });
  };

  test('compare same element', () => {
    const shapeId = service.addElement('shape', {
      shapeType: 'rect',
    });
    const shapeEl = service.getElementById(shapeId)!;
    expect(service.layer.compare(shapeEl, shapeEl)).toBe(SORT_ORDER.SAME);

    const groupId = createGroup(service, [shapeId]);
    const groupEl = service.getElementById(groupId)!;
    expect(service.layer.compare(groupEl, groupEl)).toBe(SORT_ORDER.SAME);

    const noteId = addNote(doc, {
      index: service.layer.generateIndex('affine:note'),
    });
    const note = service.getElementById(noteId)! as NoteBlockModel;
    expect(service.layer.compare(note, note)).toBe(SORT_ORDER.SAME);
  });

  test('compare a group and its child', () => {
    const shapeId = service.addElement('shape', {
      shapeType: 'rect',
    });
    const shapeEl = service.getElementById(shapeId)!;
    const noteId = addNote(doc, {
      index: service.layer.generateIndex('affine:note'),
    });
    const note = service.getElementById(noteId)! as NoteBlockModel;
    const groupId = createGroup(service, [shapeId, noteId]);
    const groupEl = service.getElementById(groupId)!;

    expect(service.layer.compare(groupEl, shapeEl)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(shapeEl, groupEl)).toBe(SORT_ORDER.AFTER);
    expect(service.layer.compare(groupEl, note)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(note, groupEl)).toBe(SORT_ORDER.AFTER);
  });

  test('compare two different elements', () => {
    const shape1Id = service.addElement('shape', {
      shapeType: 'rect',
    });
    const shape1 = service.getElementById(shape1Id)!;
    const shape2Id = service.addElement('shape', {
      shapeType: 'rect',
    });
    const shape2 = service.getElementById(shape2Id)!;
    const note1Id = addNote(doc, {
      index: service.layer.generateIndex('shape'),
    });

    const note1 = service.getElementById(note1Id)! as NoteBlockModel;
    const note2Id = addNote(doc, {
      index: service.layer.generateIndex('shape'),
    });
    const note2 = service.getElementById(note2Id)! as NoteBlockModel;

    expect(service.layer.compare(shape1, shape2)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(shape2, shape1)).toBe(SORT_ORDER.AFTER);

    expect(service.layer.compare(note1, note2)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(note2, note1)).toBe(SORT_ORDER.AFTER);

    expect(service.layer.compare(shape1, note1)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(note1, shape1)).toBe(SORT_ORDER.AFTER);

    expect(service.layer.compare(shape2, note2)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(note2, shape2)).toBe(SORT_ORDER.AFTER);
  });

  test('compare nested elements', () => {
    const shape1Id = service.addElement('shape', {
      shapeType: 'rect',
    });
    const shape2Id = service.addElement('shape', {
      shapeType: 'rect',
    });
    const note1Id = addNote(doc, {
      index: service.layer.generateIndex('shape'),
    });
    const note2Id = addNote(doc, {
      index: service.layer.generateIndex('shape'),
    });
    const group1Id = createGroup(service, [
      shape1Id,
      shape2Id,
      note1Id,
      note2Id,
    ]);
    const group2Id = createGroup(service, [group1Id]);

    const shape1 = service.getElementById(shape1Id)!;
    const shape2 = service.getElementById(shape2Id)!;
    const note1 = service.getElementById(note1Id)! as NoteBlockModel;
    const note2 = service.getElementById(note2Id)! as NoteBlockModel;
    const group1 = service.getElementById(group1Id)!;
    const group2 = service.getElementById(group2Id)!;

    // assert nested group to group
    expect(service.layer.compare(group2, group1)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(group1, group2)).toBe(SORT_ORDER.AFTER);

    // assert element in the same group
    expect(service.layer.compare(shape1, shape2)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(shape2, shape1)).toBe(SORT_ORDER.AFTER);
    expect(service.layer.compare(note1, note2)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(note2, note1)).toBe(SORT_ORDER.AFTER);

    // assert group and its nested element
    expect(service.layer.compare(group2, shape1)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(shape1, group2)).toBe(SORT_ORDER.AFTER);
    expect(service.layer.compare(group1, shape2)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(shape2, group1)).toBe(SORT_ORDER.AFTER);
    expect(service.layer.compare(group2, note1)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(note1, group2)).toBe(SORT_ORDER.AFTER);
    expect(service.layer.compare(group1, note2)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(note2, group1)).toBe(SORT_ORDER.AFTER);
  });

  test('compare two nested elements', () => {
    const groupAShapeId = service.addElement('shape', {
      shapeType: 'rect',
    });
    const groupANoteId = addNote(doc, {
      index: service.layer.generateIndex('shape'),
    });
    const groupAId = createGroup(service, [
      createGroup(service, [groupAShapeId, groupANoteId]),
    ]);
    const groupAShape = service.getElementById(groupAShapeId)!;
    const groupANote = service.getElementById(groupANoteId)!;
    const groupA = service.getElementById(groupAId)!;

    const groupBShapeId = service.addElement('shape', {
      shapeType: 'rect',
    });
    const groupBNoteId = addNote(doc, {
      index: service.layer.generateIndex('shape'),
    });
    const groupBId = createGroup(service, [
      createGroup(service, [groupBShapeId, groupBNoteId]),
    ]);
    const groupBShape = service.getElementById(groupBShapeId)!;
    const groupBNote = service.getElementById(groupBNoteId)!;
    const groupB = service.getElementById(groupBId)!;

    expect(service.layer.compare(groupAShape, groupBShape)).toBe(
      SORT_ORDER.BEFORE
    );
    expect(service.layer.compare(groupBShape, groupAShape)).toBe(
      SORT_ORDER.AFTER
    );
    expect(service.layer.compare(groupANote, groupBNote)).toBe(
      SORT_ORDER.BEFORE
    );
    expect(service.layer.compare(groupBNote, groupANote)).toBe(
      SORT_ORDER.AFTER
    );
    expect(service.layer.compare(groupB, groupA)).toBe(SORT_ORDER.AFTER);

    groupB.index = service.layer.getReorderedIndex(groupB, 'back');
    expect(service.layer.compare(groupB, groupA)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(groupAShape, groupBShape)).toBe(
      SORT_ORDER.AFTER
    );
    expect(service.layer.compare(groupBShape, groupAShape)).toBe(
      SORT_ORDER.BEFORE
    );
    expect(service.layer.compare(groupANote, groupBNote)).toBe(
      SORT_ORDER.AFTER
    );
    expect(service.layer.compare(groupBNote, groupANote)).toBe(
      SORT_ORDER.BEFORE
    );

    groupA.index = service.layer.getReorderedIndex(groupA, 'back');
    expect(service.layer.compare(groupA, groupB)).toBe(SORT_ORDER.BEFORE);
    expect(service.layer.compare(groupAShape, groupBShape)).toBe(
      SORT_ORDER.BEFORE
    );
    expect(service.layer.compare(groupBShape, groupAShape)).toBe(
      SORT_ORDER.AFTER
    );
    expect(service.layer.compare(groupANote, groupBNote)).toBe(
      SORT_ORDER.BEFORE
    );
    expect(service.layer.compare(groupBNote, groupANote)).toBe(
      SORT_ORDER.AFTER
    );
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
  const edgeless = getDocRootBlock(doc, editor, 'edgeless');
  expect(edgeless.querySelectorAll('.indexable-canvas').length).toBe(1);

  const indexedCanvas = getSurface(doc, editor).edgeless.querySelectorAll(
    '.indexable-canvas'
  )[0] as HTMLCanvasElement;

  expect(indexedCanvas.width).toBe(surface.renderer.canvas.width);
  expect(indexedCanvas.height).toBe(surface.renderer.canvas.height);
  expect(indexedCanvas.width).not.toBe(0);
  expect(indexedCanvas.height).not.toBe(0);
});

test('the actual rendering z-index should satisfy the logic order of their indexes', async () => {
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
    edgeless.querySelectorAll('gfx-viewport > [data-block-id]')
  ) as BlockComponent[];

  expect(blocks.length).toBe(indexes.length + 1);

  blocks
    .filter(block => block.flavour !== 'affine:surface')
    .forEach((block, index) => {
      if (index === blocks.length - 1) return;

      const model = block.model as BlockModel<{ index: string }>;
      const nextModel = blocks[index + 1].model as BlockModel<{
        index: string;
      }>;

      const zIndex = Number(block.style.zIndex);
      const nextZIndex = Number(blocks[index + 1].style.zIndex);

      expect(model.index <= nextModel.index).equals(zIndex <= nextZIndex);
    });
});

describe('index generator', () => {
  let preinsertedShape: BlockSuite.SurfaceElementModel;
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
    )! as BlockSuite.SurfaceElementModel;
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
