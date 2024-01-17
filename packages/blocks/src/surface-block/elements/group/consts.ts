import { Workspace } from '@blocksuite/store';

import { CanvasElementType } from '../../element-model/index.js';

export const GROUP_ROOT = { id: 'GROUP_ROOT' };

export const GroupElementDefaultProps = {
  type: CanvasElementType.GROUP,
  children: new Workspace.Y.Map(),
  title: new Workspace.Y.Text(),
};
