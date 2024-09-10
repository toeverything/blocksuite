import type { SerializedXYWH } from '@blocksuite/global/utils';

import { DEFAULT_ROUGHNESS } from '@blocksuite/affine-model';
import {
  Boxed,
  type DocCollection,
  nanoid,
  native2Y,
  Text,
  type Y,
} from '@blocksuite/store';

import type { InitFn } from './utils.js';

const SHAPE_TYPES = ['rect', 'triangle', 'ellipse', 'diamond'];
const params = new URLSearchParams(location.search);

export const heavyWhiteboard: InitFn = (
  collection: DocCollection,
  id: string
) => {
  const count = Number(params.get('count')) || 100;

  const doc = collection.createDoc({ id });
  doc.load(() => {
    // Add root block and surface block at root level
    const rootId = doc.addBlock('affine:page', {
      title: new Text(),
    });

    const surfaceBlocks: Record<string, unknown> = {};

    let i = 0;

    // Add note block inside root block
    for (; i < count; i++) {
      const x = Math.random() * count * 2;
      const y = Math.random() * count * 2;
      const id = nanoid();
      surfaceBlocks[id] = native2Y(
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
          roughness: DEFAULT_ROUGHNESS,
        },
        { deep: false }
      );
    }

    doc.addBlock(
      'affine:surface',
      {
        elements: new Boxed(native2Y(surfaceBlocks, { deep: false })) as Boxed<
          Y.Map<Y.Map<unknown>>
        >,
      },
      rootId
    );

    // Add note block inside root block
    for (i = 0; i < count; i++) {
      const x = Math.random() * -count * 2 - 100;
      const y = Math.random() * count * 2;
      const noteId = doc.addBlock(
        'affine:note',
        {
          xywh: `[${x}, ${y}, 100, 50]` as SerializedXYWH,
        },
        rootId
      );
      // Add paragraph block inside note block
      doc.addBlock(
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
