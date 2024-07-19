// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { PageEditor, createEmptyDoc } from '@blocksuite/presets';
import '@blocksuite/presets/themes/affine.css';
import { Text } from '@blocksuite/store';

const doc = createEmptyDoc().init();
const editor = new PageEditor();
editor.doc = doc;
document.body.append(editor);

const paragraphs = doc.getBlockByFlavour('affine:paragraph');
const paragraph = paragraphs[0];
doc.updateBlock(paragraph, { text: new Text('Hello World!') });
