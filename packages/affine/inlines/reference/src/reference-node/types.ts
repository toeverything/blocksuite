import type { ReferenceInfo } from '@labre/affine-model';
import type { OpenDocMode } from '@labre/affine-shared/services';
import type { EditorHost } from '@labre/std';
import type { Subject } from 'rxjs';

export type DocLinkClickedEvent = ReferenceInfo & {
  // default is active view
  openMode?: OpenDocMode;
  event?: MouseEvent;
  host: EditorHost;
};

export type RefNodeSlots = {
  docLinkClicked: Subject<DocLinkClickedEvent>;
};
