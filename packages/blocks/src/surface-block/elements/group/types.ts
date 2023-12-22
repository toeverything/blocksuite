import type { Y } from '@blocksuite/store';

import type { ISurfaceElement } from '../surface-element.js';

export interface IGroup extends ISurfaceElement {
  children: Y.Map<boolean>;
  title: Y.Text;
}
