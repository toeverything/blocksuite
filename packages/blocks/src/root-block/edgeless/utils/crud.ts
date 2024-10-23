import type { SurfaceBlockModel } from '@blocksuite/affine-block-surface';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { EditPropsStore } from '@blocksuite/affine-shared/services';
import {
  type GfxController,
  GfxControllerIdentifier,
} from '@blocksuite/block-std/gfx';

import type { Connectable } from '../../../_common/utils/index.js';
import type { EdgelessRootBlockComponent } from '../index.js';

import { getLastPropsKey } from './get-last-props-key.js';
import { isConnectable, isNoteBlock } from './query.js';

/**
 * Use deleteElementsV2 instead.
 * @deprecated
 */
export function deleteElements(
  edgeless: EdgelessRootBlockComponent,
  elements: BlockSuite.EdgelessModel[]
) {
  const set = new Set(elements);
  const { service } = edgeless;

  elements.forEach(element => {
    if (isConnectable(element)) {
      const connectors = service.getConnectors(element as Connectable);
      connectors.forEach(connector => set.add(connector));
    }
  });

  set.forEach(element => {
    if (isNoteBlock(element)) {
      const children = edgeless.doc.root?.children ?? [];
      // FIXME: should always keep at least 1 note
      if (children.length > 1) {
        edgeless.doc.deleteBlock(element);
      }
    } else {
      service.removeElement(element.id);
    }
  });
}

export function deleteElementsV2(
  gfx: GfxController,
  elements: BlockSuite.EdgelessModel[]
) {
  const set = new Set(elements);

  elements.forEach(element => {
    if (isConnectable(element)) {
      const connectors = (gfx.surface as SurfaceBlockModel).getConnectors(
        element.id
      );
      connectors.forEach(connector => set.add(connector));
    }
  });

  set.forEach(element => {
    if (isNoteBlock(element)) {
      const children = gfx.doc.root?.children ?? [];
      if (children.length > 1) {
        gfx.doc.deleteBlock(element);
      }
    } else {
      gfx.deleteElement(element.id);
    }
  });
}

export function addBlock(
  std: BlockStdScope,
  flavour: BlockSuite.EdgelessModelKeys,
  props: Record<string, unknown>,
  parentId?: string | BlockModel,
  parentIndex?: number
) {
  const gfx = std.get(GfxControllerIdentifier);
  const key = getLastPropsKey(flavour as BlockSuite.EdgelessModelKeys, props);
  if (key) {
    props = std.get(EditPropsStore).applyLastProps(key, props);
  }

  const nProps = {
    ...props,
    index: gfx.layer.generateIndex(),
  };

  return std.doc.addBlock(flavour as never, nProps, parentId, parentIndex);
}
