// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { createDefaultPage, DocEditor } from '@blocksuite/presets';

const page = createDefaultPage();
const editor = new DocEditor();
editor.page = page;
document.body.appendChild(editor);
