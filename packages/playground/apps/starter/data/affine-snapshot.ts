import { ZipTransformer } from '@blocksuite/blocks';
import { type DocCollection, Text } from '@blocksuite/store';

export async function affineSnapshot(collection: DocCollection, id: string) {
  const doc = collection.createDoc({ id });
  doc.load();
  // Add root block and surface block at root level
  const rootId = doc.addBlock('affine:page', {
    title: new Text('Affine Snapshot Test'),
  });
  doc.addBlock('affine:surface', {}, rootId);

  const path = '/apps/starter/data/snapshots/affine-default.zip';
  const response = await fetch(path);
  const file = await response.blob();
  await ZipTransformer.importDocs(collection, file);
}

affineSnapshot.id = 'affine-snapshot';
affineSnapshot.displayName = 'Affine Snapshot Test';
affineSnapshot.description = 'Affine Snapshot Test';
