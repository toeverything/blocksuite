import { Text, type Workspace } from '@blocksuite/affine/store';

import type { InitFn } from './utils.js';

export const rtlTest: InitFn = (collection: Workspace, id: string) => {
  const doc = collection.getDoc(id) ?? collection.createDoc(id);
  const store = doc.getStore();
  doc.clear();

  doc.load(() => {
    // Add root block and surface block at root level
    const rootId = store.addBlock('affine:page', {
      title: new Text('تست RTL - BlockSuite'),
    });

    store.addBlock('affine:surface', {}, rootId);

    // Add note block inside root block
    const noteId = store.addBlock('affine:note', {}, rootId);

    // Add a heading with Persian text
    store.addBlock('affine:paragraph', {
      type: 'h1',
      text: new Text([
        {
          insert: 'خوش آمدید به BlockSuite',
          attributes: {},
        },
      ]),
    }, noteId);

    // Add a paragraph with mixed LTR/RTL text
    store.addBlock('affine:paragraph', {
      type: 'text',
      text: new Text([
        {
          insert: 'سلام - این یک تست از پشتیبانی RTL در BlockSuite است. ',
          attributes: {},
        },
        {
          insert: 'Hello World',
          attributes: { bold: true },
        },
      ]),
    }, noteId);

    // Add a quote with Persian text
    store.addBlock('affine:paragraph', {
      type: 'quote',
      text: new Text([
        {
          insert: 'این یک نقل قول فارسی برای تست پشتیبانی RTL در BlockSuite است',
          attributes: {},
        },
      ]),
    }, noteId);

    // Add a list with Persian items
    const listId = store.addBlock('affine:list', {
      type: 'bulleted',
      text: new Text([
        {
          insert: 'عنصر لیست به زبان فارسی',
          attributes: {},
        },
      ]),
    }, noteId);

    store.addBlock('affine:paragraph', {
      type: 'text',
      text: new Text([
        {
          insert: 'متن فرعی در لیست',
          attributes: {},
        },
      ]),
    }, listId);

    store.addBlock('affine:paragraph', {
      type: 'text',
      text: new Text([
        {
          insert: 'عنصر دیگر با متن ترکیبی Mixed Text',
          attributes: {},
        },
      ]),
    }, listId);

    // Add a code block with Persian comments
    store.addBlock('affine:code', {
      language: 'javascript',
      text: new Text([
        {
          insert: '// کامنت فارسی\n',
          attributes: {},
        },
        {
          insert: 'function salam() {\n',
          attributes: {},
        },
        {
          insert: '  console.log("سلام دنیا");\n',
          attributes: {},
        },
        {
          insert: '}',
          attributes: {},
        },
      ]),
    }, noteId);
  });

  store.resetHistory();
};

rtlTest.id = 'rtl-test';
rtlTest.displayName = 'RTL Test';
rtlTest.description = 'Test RTL (Right-to-Left) text support with Persian (Farsi), Hebrew, and mixed content';
