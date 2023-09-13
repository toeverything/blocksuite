import type { Y } from '@blocksuite/store';

import type {
  ISurfaceElement,
  ISurfaceElementLocalRecord,
} from '../surface-element.js';

export interface IFrame extends ISurfaceElement {
  type: 'frame';
  title: Y.Text;
}

export interface IFrameLocalRecord extends ISurfaceElementLocalRecord {
  titleHide: boolean;
}
