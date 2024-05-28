import type { BlockStdScope } from '@blocksuite/block-std';
import { Job } from '@blocksuite/store';

import { SurfaceGroupLikeModel } from '../../../surface-block/element-model/base.js';
import { ConnectorElementModel } from '../../../surface-block/index.js';
import type { EdgelessFrameManager } from '../frame-manager.js';
import { EdgelessBlockModel } from '../type.js';
import { isFrameBlock } from '../utils/query.js';

export function getCloneElements(
  elements: BlockSuite.EdgelessModelType[],
  frame: EdgelessFrameManager
) {
  const set = new Set<BlockSuite.EdgelessModelType>();
  elements.forEach(element => {
    set.add(element);
    if (isFrameBlock(element)) {
      frame.getElementsInFrame(element).forEach(ele => set.add(ele));
    } else if (element instanceof SurfaceGroupLikeModel) {
      const children = element.childElements;
      getCloneElements(children, frame).forEach(ele => set.add(ele));
    }
  });
  return Array.from(set);
}

export async function prepareCloneData(
  elements: BlockSuite.EdgelessModelType[],
  std: BlockStdScope
) {
  const job = new Job({
    collection: std.collection,
  });
  const res = await Promise.all(
    elements.map(async element => {
      const data = await serializeElement(element, elements, job);
      return data;
    })
  );
  return res.filter(d => !!d);
}

export async function serializeElement(
  element: BlockSuite.EdgelessModelType,
  elements: BlockSuite.EdgelessModelType[],
  job: Job
) {
  if (element instanceof EdgelessBlockModel) {
    const snapshot = await job.blockToSnapshot(element);
    return { ...snapshot };
  } else if (element instanceof ConnectorElementModel) {
    return serializeConnector(element, elements);
  } else {
    return element.serialize();
  }
}

export function serializeConnector(
  connector: ConnectorElementModel,
  elements: BlockSuite.EdgelessModelType[]
) {
  const sourceId = connector.source?.id;
  const targetId = connector.target?.id;
  const serialized = connector.serialize();
  // if the source or target element not to be cloned
  // transfer connector position to absolute path
  if (sourceId && elements.every(s => s.id !== sourceId)) {
    serialized.source = { position: connector.absolutePath[0] };
  }
  if (targetId && elements.every(s => s.id !== targetId)) {
    serialized.target = {
      position: connector.absolutePath[connector.absolutePath.length - 1],
    };
  }
  return serialized;
}
