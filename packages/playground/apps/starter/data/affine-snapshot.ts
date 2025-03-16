import { ZipTransformer } from '@blocksuite/affine/blocks/root';
import { AffineSchemas } from '@blocksuite/affine/schemas';
import { Schema, Text, type Workspace } from '@blocksuite/affine/store';
export async function affineSnapshot(collection: Workspace, id: string) {
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
  const schema = new Schema();
  schema.register(AffineSchemas);
  await ZipTransformer.importDocs(collection, schema, file);
}

affineSnapshot.id = 'affine-snapshot';
affineSnapshot.displayName = 'Affine Snapshot Test';
affineSnapshot.description = 'Affine Snapshot Test';
