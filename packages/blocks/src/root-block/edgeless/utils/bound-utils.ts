import type { SerializedElement } from '@blocksuite/block-std/gfx';

import { Bound, getBoundWithRotation } from '@blocksuite/global/utils';
import { type BlockSnapshot, BlockSnapshotSchema } from '@blocksuite/store';

export function getBoundFromSerializedElement(element: SerializedElement) {
  return Bound.from(
    getBoundWithRotation({
      ...Bound.deserialize(element.xywh),
      rotate: typeof element.rotate === 'number' ? element.rotate : 0,
    })
  );
}

export function getBoundFromGfxBlockSnapshot(snapshot: BlockSnapshot) {
  if (typeof snapshot.props.xywh !== 'string') return null;
  return Bound.deserialize(snapshot.props.xywh);
}

export function edgelessElementsBoundFromRawData(
  elementsRawData: (SerializedElement | BlockSnapshot)[]
) {
  if (elementsRawData.length === 0) return new Bound();

  let prev: Bound | null = null;

  for (const data of elementsRawData) {
    const { data: blockSnapshot } = BlockSnapshotSchema.safeParse(data);
    const bound = blockSnapshot
      ? getBoundFromGfxBlockSnapshot(blockSnapshot)
      : getBoundFromSerializedElement(data as SerializedElement);

    if (!bound) continue;
    if (!prev) prev = bound;
    else prev = prev.unite(bound);
  }

  return prev ?? new Bound();
}
