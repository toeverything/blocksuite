import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '@blocksuite/blocks';
import { serializeXYWH } from '@blocksuite/phasor';
import { nanoid, Text, type Workspace } from '@blocksuite/store';

import { getOptions } from '../utils';
import { addShapeElement, type InitFn } from './utils';

const SHAPE_TYPES = ['rect', 'triangle', 'ellipse', 'diamond'];

export const heavyWhiteboard: InitFn = (workspace: Workspace, id: string) => {
  const { count } = getOptions((params: URLSearchParams) => {
    const count = Number(params.get('count')) || 100;
    return {
      count,
    };
  }) as {
    count: number;
  };

  const page = workspace.createPage({ id });

  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text(),
  });

  const surfaceBlockId = page.addBlock('affine:surface', {}, pageBlockId);

  let i = 0;

  // Add frame block inside page block
  for (; i < count; i++) {
    const x = Math.random() * count * 2;
    const y = Math.random() * count * 2;
    addShapeElement(page, surfaceBlockId, {
      id: nanoid(),
      index: 'a0',
      type: 'shape',
      xywh: `[${x},${y},100,100]`,
      seed: Math.floor(Math.random() * 2 ** 31),

      shapeType: SHAPE_TYPES[Math.floor(Math.random() * 40) % 4],

      radius: 0,
      filled: false,
      fillColor: DEFAULT_SHAPE_FILL_COLOR,
      strokeWidth: 4,
      strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
      strokeStyle: 'solid',
    });
  }

  // Add frame block inside page block
  for (i = 0; i < count; i++) {
    const x = Math.random() * -count * 2 - 100;
    const y = Math.random() * count * 2;
    const frameId = page.addBlock(
      'affine:frame',
      {
        xywh: serializeXYWH(x, y, 100, 50),
      },
      pageBlockId
    );
    // Add paragraph block inside frame block
    page.addBlock(
      'affine:paragraph',
      {
        text: new Text('Frame #' + i),
      },
      frameId
    );
  }
};

heavyWhiteboard.id = 'heavy-whiteboard';
heavyWhiteboard.displayName = 'Heavy Whiteboard';
heavyWhiteboard.description = 'Heavy Whiteboard on 200 elements by default';
