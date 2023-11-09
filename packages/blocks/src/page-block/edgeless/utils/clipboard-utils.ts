import { assertExists } from '@blocksuite/global/utils';
import { Job, Workspace } from '@blocksuite/store';

import type { EdgelessElement } from '../../../_common/utils/index.js';
import { EdgelessBlockType } from '../../../surface-block/edgeless-types.js';
import {
  Bound,
  ConnectorElement,
  GroupElement,
} from '../../../surface-block/index.js';
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

        const note = surface.pickById(id);
        assertExists(note);

        const job = new Job({
          workspace: edgeless.root.std.workspace,
        });
        const snapshot = await job.blockToSnapshot(element);
        snapshot.children.forEach(child => {
          edgeless.pageClipboardController.onBlockSnapshotPaste(
            child,
            page,
            note.id
          );
        });
      } else if (isFrameBlock(element)) {
        const job = new Job({
          workspace: edgeless.root.std.workspace,
        });
        const blockSnapshot = await job.blockToSnapshot(element);
        const props = blockSnapshot.props;

        id = surface.addElement(
          EdgelessBlockType.FRAME,
          {
            xywh: bound.serialize(),
            title: new Workspace.Y.Text(props.title as string),
            background: props.background,
          },
          surface.model.id
        );
      } else if (isImageBlock(element)) {
        const job = new Job({
          workspace: edgeless.root.std.workspace,
        });
        const blockSnapshot = await job.blockToSnapshot(element);
        const props = blockSnapshot.props;

        id = surface.addElement(
          EdgelessBlockType.IMAGE,
          {
            xywh: bound.serialize(),
            sourceId: props.sourceId,
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
