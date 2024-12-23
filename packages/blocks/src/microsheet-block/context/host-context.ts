import type { EditorHost } from '@blocksuite/block-std';

import { createContextKey } from '@blocksuite/microsheet-data-view';

export const HostContextKey = createContextKey<EditorHost | undefined>(
  'editor-host',
  undefined
);
