import { expect, test } from 'vitest';
import * as Y from 'yjs';

import {
  defineBlockSchema,
  Schema,
  type SchemaToModel,
} from '../schema/index.js';
import { Block, type YBlock } from '../store/doc/block.js';
import { DocCollection, Generator } from '../store/index.js';

const pageSchema = defineBlockSchema({
  flavour: 'page',
  props: internal => ({
    title: internal.Text(),
    count: 0,
    style: {} as Record<string, unknown>,
  }),
  metadata: {
    role: 'root',
    version: 1,
  },
});
type RootModel = SchemaToModel<typeof pageSchema>;

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register([pageSchema]);
  return { id: 'test-collection', idGenerator, schema };
}

const defaultDocId = 'doc:home';
function createTestDoc(docId = defaultDocId) {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();
  const doc = collection.createDoc({ id: docId });
  doc.load();
  return doc;
}

test('init block without props should add default props', () => {
  const doc = createTestDoc();
  const yDoc = new Y.Doc();
  const yBlock = yDoc.getMap('yBlock') as YBlock;
  yBlock.set('sys:id', '0');
  yBlock.set('sys:flavour', 'page');
  yBlock.set('sys:children', new Y.Array());

  const block = new Block(doc.schema, yBlock, doc);
  const model = block.model as RootModel;

  expect(yBlock.get('prop:count')).toBe(0);
  expect(model.count).toBe(0);
  expect(model.style).toEqual({});
});
