import type { EditorHost } from '@blocksuite/block-std';

import { createContextKey } from '../data-view/common/data-source/context.js';

export const HostContextKey = createContextKey<EditorHost>('editor-host');
