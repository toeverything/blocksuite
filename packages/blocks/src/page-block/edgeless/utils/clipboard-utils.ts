import { assertExists } from '@blocksuite/global/utils';
import { Job, Workspace } from '@blocksuite/store';

import type { EdgelessElement } from '../../../_common/utils/index.js';
import { EdgelessBlockType } from '../../../surface-block/edgeless-types.js';
import { Bound, ConnectorElement } from '../../../surface-block/index.js';
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
  const newElements = await Promise.all(
    getCopyElements(surface, elements).map(async element => {
      const bound = isFrameBlock(element)
        ? Bound.deserialize(element.xywh)
        : getGridBound(element);
      bound.x += totalBound.w + offset;
      if (isNoteBlock(element)) {
        const noteId = surface.addElement(
          element.flavour,
          { xywh: bound.serialize() },
          page.root?.id
        );
        const block = page.getBlockById(noteId);
        assertExists(block);

        const note = surface.pickById(noteId);
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

        return noteId;
      } else if (isFrameBlock(element)) {
        const job = new Job({
          workspace: edgeless.root.std.workspace,
        });
        const blockSnapshot = await job.blockToSnapshot(element);
        const props = blockSnapshot.props;

        return surface.addElement(
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

        return surface.addElement(
          EdgelessBlockType.IMAGE,
          {
            xywh: bound.serialize(),
            sourceId: props.sourceId,
          },
          surface.model.id
        );
      } else {
        const id = surface.addElement(element.type, {
          ...element.serialize(),
          xywh: bound.serialize(),
        } as unknown as Record<string, unknown>);
        const newElement = surface.pickById(id);
        assertExists(newElement);
        if (newElement instanceof ConnectorElement) {
          surface.connector.updateXYWH(newElement, bound);
        }
        return id;
      }
    })
  );

  if (select) {
    edgeless.selectionManager.setSelection({
      elements: newElements,
      editing: false,
    });
  }
}
