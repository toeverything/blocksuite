import { type DocCollection, Text } from '@blocksuite/store';

import type { InitFn } from './utils.js';

export const linked: InitFn = (collection: DocCollection, id: string) => {
  const docA = collection.getDoc(id) ?? collection.createDoc({ id });

  const docBId = 'doc:linked-page';
  const docB = collection.createDoc({ id: docBId });

  const docCId = 'doc:linked-edgeless';
  const docC = collection.createDoc({ id: docCId });

  docA.clear();
  docB.clear();
  docC.clear();

  docB.load(() => {
    const rootId = docB.addBlock('affine:page', {
      title: new Text(''),
    });

    docB.addBlock('affine:surface', {}, rootId);

    // Add note block inside root block
    const noteId = docB.addBlock('affine:note', {}, rootId);
    // Add paragraph block inside note block
    docB.addBlock('affine:paragraph', {}, noteId);
  });

  docC.load(() => {
    const rootId = docC.addBlock('affine:page', {
      title: new Text(''),
    });

    docC.addBlock('affine:surface', {}, rootId);

    // Add note block inside root block
    const noteId = docC.addBlock('affine:note', {}, rootId);
    // Add paragraph block inside note block
    docC.addBlock('affine:paragraph', {}, noteId);
  });

  docA.load();
  // Add root block and surface block at root level
  const rootId = docA.addBlock('affine:page', {
    title: new Text('Doc A'),
  });

  docA.addBlock('affine:surface', {}, rootId);

  // Add note block inside root block
  const noteId = docA.addBlock('affine:note', {}, rootId);
  // Add paragraph block inside note block
  docA.addBlock('affine:paragraph', {}, noteId);

  docA.addBlock('affine:embed-linked-doc', { pageId: docBId }, noteId);

  docA.addBlock(
    'affine:embed-linked-doc',
    { pageId: 'doc:deleted-example' },
    noteId
  );

  docA.addBlock('affine:embed-linked-doc', { pageId: docCId }, noteId);

  docA.addBlock(
    'affine:embed-linked-doc',
    { pageId: 'doc:deleted-example-edgeless' },
    noteId
  );

  docA.resetHistory();
  docB.resetHistory();
  docC.resetHistory();
};

linked.id = 'linked';
linked.displayName = 'Linked Doc Editor';
linked.description = 'A demo with linked docs';
