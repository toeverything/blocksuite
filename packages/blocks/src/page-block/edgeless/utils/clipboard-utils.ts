import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import type { EdgelessElement } from '../../../_common/utils/index.js';
import { groupBy } from '../../../_common/utils/iterable.js';
import { getBlockClipboardInfo } from '../../../_legacy/clipboard/index.js';
import type { FrameBlockService } from '../../../_legacy/service/legacy-services/frame-service.js';
import type { ImageBlockService } from '../../../_legacy/service/legacy-services/image-service.js';
import type { FrameBlockModel } from '../../../frame-block/index.js';
import type { ImageBlockModel } from '../../../image-block/index.js';
import type { NoteBlockModel } from '../../../note-block/index.js';
import { EdgelessBlockType } from '../../../surface-block/edgeless-types.js';
import {
  Bound,
  ConnectorElement,
  GroupElement,
  type PhasorElement,
} from '../../../surface-block/index.js';
import { getElementsWithoutGroup } from '../../../surface-block/managers/group-manager.js';
import { getCopyElements } from '../controllers/clipboard.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { edgelessElementsBound, getGridBound } from './bound-utils.js';
import { isFrameBlock, isImageBlock, isNoteBlock } from './query.js';

const offset = 10;
export async function duplicate(
  edgeless: EdgelessPageBlockComponent,
  elements: EdgelessElement[],
  select = true
) {
  const { surface, page } = edgeless;
  const totalBound = edgelessElementsBound(elements);
  const copyElements = getCopyElements(surface, elements);
  const idMap = new Map<string, string>();

  const newElements = await Promise.all(
    copyElements.map(async element => {
      const bound = isFrameBlock(element)
        ? Bound.deserialize(element.xywh)
        : getGridBound(element);
      bound.x += totalBound.w + offset;
      let id;
      if (isNoteBlock(element)) {
        id = surface.addElement(
          element.flavour,
          { xywh: bound.serialize() },
          page.root?.id
        );
        const block = page.getBlockById(id);

        assertExists(block);
        const serializedBlock = (await getBlockClipboardInfo(element)).json;

        const service = edgeless.getService(element.flavour);
        await service.json2Block(block, serializedBlock.children);
      } else if (isFrameBlock(element)) {
        const service = edgeless.getService(
          element.flavour
        ) as FrameBlockService;
        const json = service.block2Json(element);
        id = surface.addElement(
          EdgelessBlockType.FRAME,
          {
            xywh: bound.serialize(),
            title: new Workspace.Y.Text(json.title),
            background: json.background,
          },
          surface.model.id
        );
      } else if (isImageBlock(element)) {
        const service = edgeless.getService(
          element.flavour
        ) as ImageBlockService;
        const json = service.block2Json(element, []);
        id = surface.addElement(
          EdgelessBlockType.IMAGE,
          {
            xywh: bound.serialize(),
            sourceId: json.sourceId,
          },
          surface.model.id
        );
      } else if (element instanceof GroupElement) {
        const props = element.serialize();
        const yMap = new Workspace.Y.Map<boolean>();
        const children = props.children ?? {};
        for (const [key, value] of Object.entries(children)) {
          const newKey = idMap.get(key);
          assertExists(newKey);
          yMap.set(newKey, value);
        }
        props.children = yMap;
        id = surface.addElement(element.type, props);
      } else {
        id = surface.addElement(element.type, {
          ...element.serialize(),
          xywh: bound.serialize(),
        } as unknown as Record<string, unknown>);
        const newElement = surface.pickById(id);
        assertExists(newElement);
        if (newElement instanceof ConnectorElement) {
          surface.connector.updateXYWH(newElement, bound);
        }
      }
      idMap.set(element.id, id);
      return id;
    })
  );

  if (select) {
    edgeless.selectionManager.setSelection({
      elements: newElements,
      editing: false,
    });
  }
}
export const splitElements = (elements: EdgelessElement[]) => {
  const { notes, frames, shapes, images } = groupBy(
    getElementsWithoutGroup(elements),
    element => {
      if (isNoteBlock(element)) {
        return 'notes';
      } else if (isFrameBlock(element)) {
        return 'frames';
      } else if (isImageBlock(element)) {
        return 'images';
      }
      return 'shapes';
    }
  ) as {
    notes: NoteBlockModel[];
    shapes: PhasorElement[];
    frames: FrameBlockModel[];
    images: ImageBlockModel[];
  };

  return {
    notes: notes ?? [],
    shapes: shapes ?? [],
    frames: frames ?? [],
    images: images ?? [],
  };
};
