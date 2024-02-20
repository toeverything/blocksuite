// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { createEmptyPage, EdgelessEditor } from '@blocksuite/presets';

const page = createEmptyPage().init();
const editor = new EdgelessEditor();
editor.page = page;
document.body.appendChild(editor);
