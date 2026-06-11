import { createIdentifier } from '@labre/global/di';
import type { EditorHost } from '@labre/std';

export const EditorHostKey = createIdentifier<EditorHost>('editor-host');
