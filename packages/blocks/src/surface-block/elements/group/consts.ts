import { Workspace } from '@blocksuite/store';

import {
  CanvasElementType,
  type IElementDefaultProps,
} from '../edgeless-element.js';

export const GROUP_ROOT = { id: 'GROUP_ROOT' };

export const GroupElementDefaultProps: IElementDefaultProps<'group'> = {
  type: CanvasElementType.GROUP,
  children: new Workspace.Y.Map(),
  title: new Workspace.Y.Text(),
};
