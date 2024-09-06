import { expect, test } from 'vitest';
import * as Y from 'yjs';

import { MemoryBlobCRUD } from '../adapter/index.js';
import { Text } from '../reactive/index.js';
import {
  type BlockModel,
  defineBlockSchema,
  Schema,
  type SchemaToModel,
} from '../schema/index.js';
import { DocCollection, IdGeneratorType } from '../store/index.js';
import { AssetsManager, BaseBlockTransformer } from '../transformer/index.js';

const docSchema = defineBlockSchema({
  flavour: 'page',
  props: internal => ({
    title: internal.Text('doc title'),
    count: 3,
    style: {
      color: 'red',
    },
    items: [
      {
        id: 0,
        content: internal.Text('item 1'),
      },
      {
        id: 1,
        content: internal.Text('item 2'),
      },
      {
        id: 2,
        content: internal.Text('item 3'),
      },
    ],
  }),
  metadata: {
    role: 'root',
    version: 1,
  },
});

type RootBlockModel = SchemaToModel<typeof docSchema>;

function createTestOptions() {
  const idGenerator = IdGeneratorType.AutoIncrement;
  const schema = new Schema();
  schema.register([docSchema]);
  return { id: 'test-collection', idGenerator, schema };
}

const transformer = new BaseBlockTransformer();
const blobCRUD = new MemoryBlobCRUD();
const assets = new AssetsManager({ blob: blobCRUD });

test('model to snapshot', () => {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();
  const doc = collection.createDoc({ id: 'home' });
  doc.load();
  doc.addBlock('page');
  const rootModel = doc.root as RootBlockModel;

  expect(rootModel).not.toBeNull();
  const snapshot = transformer.toSnapshot({
    model: rootModel,
    assets,
  });
  expect(snapshot).toMatchSnapshot();
});

test('snapshot to model', async () => {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();
  const doc = collection.createDoc({ id: 'home' });
  doc.load();
  doc.addBlock('page');
  const rootModel = doc.root as RootBlockModel;

  const tempDoc = new Y.Doc();
  const map = tempDoc.getMap('temp');

  expect(rootModel).not.toBeNull();
  const snapshot = await transformer.toSnapshot({
    model: rootModel,
    assets,
  });

  const model = await transformer.fromSnapshot({
    json: snapshot,
    assets,
    children: [],
  });
  expect(model.flavour).toBe(rootModel.flavour);

  // @ts-ignore
  expect(model.props.title).toBeInstanceOf(Text);

  // @ts-ignore
  map.set('title', model.props.title.yText);
  // @ts-ignore
  expect(model.props.title.toString()).toBe('doc title');

  // @ts-ignore
  expect(model.props.style).toEqual({
    color: 'red',
  });

  // @ts-ignore
  expect(model.props.count).toBe(3);

  // @ts-ignore
  expect(model.props.items).toMatchObject([
    {
      id: 0,
    },
    {
      id: 1,
    },
    {
      id: 2,
    },
  ]);

  // @ts-ignore
  model.props.items.forEach((item, index) => {
    expect(item.content).toBeInstanceOf(Text);
    const key = `item:${index}:content`;
    map.set(key, item.content.yText);
    expect(item.content.toString()).toBe(`item ${index + 1}`);
  });
});

declare global {
  namespace BlockSuite {
    interface BlockModels {
      page: BlockModel;
    }
  }
}
