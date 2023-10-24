import { Workspace } from '@blocksuite/store';

import {
  type IElementDefaultProps,
  PhasorElementType,
} from '../edgeless-element.js';

export const groupRootId = 'group-root';

export const GroupElementDefaultProps: IElementDefaultProps<'group'> = {
  type: PhasorElementType.GROUP,
  children: new Workspace.Y.Map(),
  title: new Workspace.Y.Text(),
};
