// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { createEmptyPage, EdgelessEditor } from '@blocksuite/presets';

const container = document.createElement('div');
container.style.display = 'flex';
container.style.height = '100%';
container.style.width = '100%';
document.body.appendChild(container);

const page1 = createEmptyPage().init();
const editor1 = new EdgelessEditor();
editor1.page = page1;
editor1.style.flex = '1';
editor1.style.borderRight = '1px solid #ccc';
container.appendChild(editor1);

const page2 = createEmptyPage().init();
const editor2 = new EdgelessEditor();
editor2.page = page2;
editor2.style.flex = '1';
editor2.style.borderLeft = '1px solid #ccc';
container.appendChild(editor2);
