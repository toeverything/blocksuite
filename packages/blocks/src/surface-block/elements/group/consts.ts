import { Workspace } from '@blocksuite/store';

import {
  type IElementDefaultProps,
  PhasorElementType,
} from '../edgeless-element.js';

export const GROUP_ROOT_ID = 'GROUP_ROOT';

export const GROUP_ROOT = { id: GROUP_ROOT_ID };

export const GroupElementDefaultProps: IElementDefaultProps<'group'> = {
  type: PhasorElementType.GROUP,
  children: new Workspace.Y.Map(),
  title: new Workspace.Y.Text(),
};
