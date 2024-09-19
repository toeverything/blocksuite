import type {
  FrameBlockProps,
  NodeDetail,
  SerializedConnectorElement,
  SerializedGroupElement,
  SerializedMindmapElement,
} from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';

import {
  ConnectorElementModel,
  GroupElementModel,
  MindmapElementModel,
} from '@blocksuite/affine-model';
import {
  isGfxContainerElm,
  type SerializedElement,
} from '@blocksuite/block-std/gfx';
import { type BlockSnapshot, Job } from '@blocksuite/store';

import { GfxBlockModel } from '../block-model.js';
import { getAllDescendantElements, getTopElements } from './tree.js';

/**
 * return all elements in the tree of the elements
 */
export function getSortedCloneElements(elements: BlockSuite.EdgelessModel[]) {
  const set = new Set<BlockSuite.EdgelessModel>();
  elements.forEach(element => {
    // this element subtree has been added
    if (set.has(element)) return;

    getAllDescendantElements(element, true).map(descendant =>
      set.add(descendant)
    );
  });
  return sortEdgelessElements([...set]);
}

export async function prepareCloneData(
  elements: BlockSuite.EdgelessModel[],
  std: BlockStdScope
) {
  elements = sortEdgelessElements(elements);
  const job = new Job({
    collection: std.collection,
  });
  const res = await Promise.all(
    elements.map(async element => {
      const data = await serializeElement(element, elements, job);
      return data;
    })
  );
  return res.filter((d): d is SerializedElement | BlockSnapshot => !!d);
}

export async function serializeElement(
  element: BlockSuite.EdgelessModel,
  elements: BlockSuite.EdgelessModel[],
  job: Job
) {
  if (element instanceof GfxBlockModel) {
    const snapshot = await job.blockToSnapshot(element);
    if (!snapshot) {
      return;
    }
    return { ...snapshot };
  } else if (element instanceof ConnectorElementModel) {
    return serializeConnector(element, elements);
  } else {
    return element.serialize();
  }
}

export function serializeConnector(
  connector: ConnectorElementModel,
  elements: BlockSuite.EdgelessModel[]
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
export function sortEdgelessElements(elements: BlockSuite.EdgelessModel[]) {
  // Since each element has a parent-child relationship, and from-to connector relationship
  // the child element must be added before the parent element
  // and the connected elements must be added before the connector element
  // To achieve this, we do a post-order traversal of the tree

  const result: BlockSuite.EdgelessModel[] = [];

  const topElements = getTopElements(elements);

  // the connector element must be added after the connected elements
  const moveConnectorToEnd = (elements: BlockSuite.EdgelessModel[]) => {
    const connectors = elements.filter(
      element => element instanceof ConnectorElementModel
    );
    const rest = elements.filter(
      element => !(element instanceof ConnectorElementModel)
    );
    return [...rest, ...connectors];
  };

  const traverse = (element: BlockSuite.EdgelessModel) => {
    if (isGfxContainerElm(element)) {
      moveConnectorToEnd(element.childElements).forEach(child =>
        traverse(child)
      );
    }
    result.push(element);
  };

  moveConnectorToEnd(topElements).forEach(element => traverse(element));

  return result;
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
 * map frame children ids
 * @param props frame block props
 * @param ids old element id to new element id map
 * @returns updated frame block props
 */
export function mapFrameIds(props: FrameBlockProps, ids: Map<string, string>) {
  const oldChildIds = [
    ...(props.childElementIds ? Object.keys(props.childElementIds) : []),
  ];
  const newChildIds: Record<string, boolean> = {};
  oldChildIds.forEach(oldId => {
    const newIds = ids.get(oldId);
    if (newIds) newChildIds[newIds] = true;
  });
  props.childElementIds = newChildIds;

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
  element: BlockSuite.SurfaceModel,
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
