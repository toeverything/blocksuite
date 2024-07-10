import type { BlockStdScope } from '@blocksuite/block-std';
import { Job } from '@blocksuite/store';

import { groupBy } from '../../../_common/utils/iterable.js';
import { SurfaceGroupLikeModel } from '../../../surface-block/element-model/base.js';
import type { SerializedConnectorElement } from '../../../surface-block/element-model/connector.js';
import type { SerializedGroupElement } from '../../../surface-block/element-model/group.js';
import type { SerializedMindmapElement } from '../../../surface-block/element-model/mindmap.js';
import type { NodeDetail } from '../../../surface-block/element-model/utils/mindmap/layout.js';
import {
  ConnectorElementModel,
  GroupElementModel,
  MindmapElementModel,
} from '../../../surface-block/index.js';
import { EdgelessBlockModel } from '../edgeless-block-model.js';
import type { EdgelessFrameManager } from '../frame-manager.js';
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

/**
 * There are interdependencies between elements,
 * so they must be added in a certain order
 * @param elements edgeless model list
 * @returns sorted edgeless model list
 */
export function sortEdgelessElements(elements: BlockSuite.EdgelessModelType[]) {
  const result = groupBy(elements, element => {
    if (element instanceof ConnectorElementModel) {
      return 'connector';
    }
    if (element instanceof GroupElementModel) {
      return 'group';
    }
    if (element instanceof MindmapElementModel) {
      return 'mindmap';
    }
    return 'default';
  });
  return [
    ...(result.default ?? []),
    ...(result.connector ?? []),
    ...(result.group ?? []),
    ...(result.mindmap ?? []),
  ];
}

/**
 * map connector source & target ids
 * @param props serialized element props
 * @param ids old element id to new element id map
 * @returns updated element props
 */
export function mapConnectorIds(
  props: SerializedConnectorElement,
  ids: Map<string, string>
) {
  if (props.source.id) {
    props.source.id = ids.get(props.source.id);
  }
  if (props.target.id) {
    props.target.id = ids.get(props.target.id);
  }
  return props;
}

/**
 * map group children ids
 * @param props serialized element props
 * @param ids old element id to new element id map
 * @returns updated element props
 */
export function mapGroupIds(
  props: SerializedGroupElement,
  ids: Map<string, string>
) {
  if (props.children) {
    const newMap: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(props.children)) {
      const newKey = ids.get(key);
      if (newKey) {
        newMap[newKey] = value;
      }
    }
    props.children = newMap;
  }
  return props;
}

/**
 * map mindmap children & parent ids
 * @param props serialized element props
 * @param ids old element id to new element id map
 * @returns updated element props
 */
export function mapMindmapIds(
  props: SerializedMindmapElement,
  ids: Map<string, string>
) {
  if (props.children) {
    const newMap: Record<string, NodeDetail> = {};
    for (const [key, value] of Object.entries(props.children)) {
      const newKey = ids.get(key);
      if (value.parent) {
        const newParent = ids.get(value.parent);
        value.parent = newParent;
      }
      if (newKey) {
        newMap[newKey] = value;
      }
    }
    props.children = newMap;
  }
  return props;
}

export function getElementProps(
  element: BlockSuite.SurfaceModelType,
  ids: Map<string, string>
) {
  if (element instanceof ConnectorElementModel) {
    const props = element.serialize();
    return mapConnectorIds(props, ids);
  }
  if (element instanceof GroupElementModel) {
    const props = element.serialize();
    return mapGroupIds(props, ids);
  }
  if (element instanceof MindmapElementModel) {
    const props = element.serialize();
    return mapMindmapIds(props, ids);
  }
  return element.serialize();
}
