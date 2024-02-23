// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { createEmptyPage, DocEditor } from '@blocksuite/presets';
import { Text } from '@blocksuite/store';

const page = createEmptyPage().init();
const editor = new DocEditor();
editor.page = page;
document.body.appendChild(editor);

const paragraphs = page.getBlockByFlavour('affine:paragraph');
const paragraph = paragraphs[0];
page.updateBlock(paragraph, { text: new Text('Hello World!') });
