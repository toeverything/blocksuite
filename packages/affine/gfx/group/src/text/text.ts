import type { GroupElementModel } from '@blocksuite/affine-model';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import type { BlockComponent } from '@blocksuite/std';
import { GfxControllerIdentifier } from '@blocksuite/std/gfx';

import { EdgelessGroupTitleEditor } from './edgeless-group-title-editor';

export function mountGroupTitleEditor(
  group: GroupElementModel,
  edgeless: BlockComponent
) {
  const mountElm = edgeless.querySelector('.edgeless-mount-point');
  if (!mountElm) {
    throw new BlockSuiteError(
      ErrorCode.ValueNotExists,
      "edgeless block's mount point does not exist"
    );
  }

  const gfx = edgeless.std.get(GfxControllerIdentifier);

  // @ts-expect-error FIXME: resolve after gfx tool refactor
  gfx.tool.setTool('default');
  gfx.selection.set({
    elements: [group.id],
    editing: true,
  });

  const groupEditor = new EdgelessGroupTitleEditor();
  groupEditor.group = group;

  mountElm.append(groupEditor);
}
