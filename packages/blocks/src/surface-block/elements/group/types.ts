import type { Y } from '@blocksuite/store';

import type {
  ISurfaceElement,
  ISurfaceElementLocalRecord,
} from '../surface-element.js';

export interface IGroup extends ISurfaceElement {
  children: Y.Map<boolean>;
  title: Y.Text;
}

export interface IGroupLocalRecord extends ISurfaceElementLocalRecord {
  titleHide: boolean;
}
