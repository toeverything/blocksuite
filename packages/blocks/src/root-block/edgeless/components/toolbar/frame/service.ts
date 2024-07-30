import { Bound } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';

/**
 * Create a frame block with the given width and height
 */
export const createFrame = (
  edgeless: EdgelessRootBlockComponent,
  wh: number[]
) => {
  const frames = edgeless.service.frames;
  const center = edgeless.service.viewport.center;
  const bound = new Bound(
    center.x - wh[0] / 2,
    center.y - wh[1] / 2,
    wh[0],
    wh[1]
  );
  const id = edgeless.service.addBlock(
    'affine:frame',
    {
      title: new DocCollection.Y.Text(`Frame ${frames.length + 1}`),
      xywh: bound.serialize(),
    },
    edgeless.surface.model
  );
  edgeless.doc.captureSync();
  const frame = edgeless.service.getElementById(id);
  assertExists(frame);
  edgeless.tools.setEdgelessTool({ type: 'default' });
  edgeless.service.selection.set({
    elements: [frame.id],
    editing: false,
  });
};
