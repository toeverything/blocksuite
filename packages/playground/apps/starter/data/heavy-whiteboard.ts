import {
  Boxed,
  nanoid,
  native2Y,
  Text,
  type Workspace,
} from '@blocksuite/store';

import { getOptions } from '../utils.js';
import { type InitFn } from './utils.js';

const SHAPE_TYPES = ['rect', 'triangle', 'ellipse', 'diamond'];

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const heavyWhiteboard: InitFn = async (
  workspace: Workspace,
  id: string
) => {
  const { count } = getOptions((params: URLSearchParams) => {
    const count = Number(params.get('count')) || 100;
    return {
      count,
    };
  }) as {
    count: number;
  };

  const page = workspace.createPage({ id });
  await page.load(() => {
    // Add page block and surface block at root level
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text(),
    });

    const surfaceBlockElements: Record<string, unknown> = {};

    let i = 0;

    // Add note block inside page block
    for (; i < count; i++) {
      const x = Math.random() * count * 2;
      const y = Math.random() * count * 2;
      const id = nanoid();
      surfaceBlockElements[id] = native2Y(
        {
          id,
          index: 'a0',
          type: 'shape',
          xywh: `[${x},${y},100,100]`,
          seed: Math.floor(Math.random() * 2 ** 31),

          shapeType: SHAPE_TYPES[Math.floor(Math.random() * 40) % 4],

          radius: 0,
          filled: false,
          fillColor: '--affine-palette-shape-yellow',
          strokeWidth: 4,
          strokeColor: '--affine-palette-line-yellow',
          strokeStyle: 'solid',
          roughness: 1.4,
        },
        { deep: false }
      );
    }

    page.addBlock(
      'affine:surface',
      { elements: new Boxed(native2Y(surfaceBlockElements, { deep: false })) },
      pageBlockId
    );

    // Add note block inside page block
    for (i = 0; i < count; i++) {
      const x = Math.random() * -count * 2 - 100;
      const y = Math.random() * count * 2;
      const noteId = page.addBlock(
        'affine:note',
        {
          xywh: `[${x}, ${y}, 100, 50]`,
        },
        pageBlockId
      );
      // Add paragraph block inside note block
      page.addBlock(
        'affine:paragraph',
        {
          text: new Text('Note #' + i),
        },
        noteId
      );
    }
  });
};

heavyWhiteboard.id = 'heavy-whiteboard';
heavyWhiteboard.displayName = 'Heavy Whiteboard';
heavyWhiteboard.description = 'Heavy Whiteboard on 200 elements by default';
