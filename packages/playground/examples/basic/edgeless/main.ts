// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { createEmptyDoc, EdgelessEditor } from '@blocksuite/presets';

const doc = createEmptyDoc().init();
const editor = new EdgelessEditor();
editor.doc = doc;
document.body.append(editor);
