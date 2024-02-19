import { expect, test } from 'vitest';
import * as Y from 'yjs';

import { MemoryBlobManager } from '../adapter/index.js';
import { Text } from '../reactive/index.js';
import {
  defineBlockSchema,
  Schema,
  type SchemaToModel,
} from '../schema/index.js';
import { AssetsManager, BaseBlockTransformer } from '../transformer/index.js';
import { Generator, Workspace } from '../workspace/index.js';

const pageSchema = defineBlockSchema({
  flavour: 'page',
  props: internal => ({
    title: internal.Text('page title'),
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

type PageBlockModel = SchemaToModel<typeof pageSchema>;

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register([pageSchema]);
  return { id: 'test-workspace', idGenerator, schema };
}

const transformer = new BaseBlockTransformer();
const blobManager = new MemoryBlobManager();
const assets = new AssetsManager({ blob: blobManager });

test('model to snapshot', () => {
  const options = createTestOptions();
  const workspace = new Workspace(options);
  const page = workspace.createPage({ id: 'home' });
  page.load();
  page.addBlock('page');
  const root = page.root as PageBlockModel;

  expect(root).not.toBeNull();
  const snapshot = transformer.toSnapshot({
    model: root,
    assets,
  });
  expect(snapshot).toMatchSnapshot();
});

test('snapshot to model', async () => {
  const options = createTestOptions();
  const workspace = new Workspace(options);
  const page = workspace.createPage({ id: 'home' });
  page.load();
  page.addBlock('page');
  const root = page.root as PageBlockModel;

  const tempDoc = new Y.Doc();
  const map = tempDoc.getMap('temp');

  expect(root).not.toBeNull();
  const snapshot = await transformer.toSnapshot({
    model: root,
    assets,
  });

  const model = await transformer.fromSnapshot({
    json: snapshot,
    assets,
    children: [],
  });
  expect(model.flavour).toBe(root.flavour);

  // @ts-ignore
  expect(model.props.title).toBeInstanceOf(Text);

  // @ts-ignore
  map.set('title', model.props.title.yText);
  // @ts-ignore
  expect(model.props.title.toString()).toBe('page title');

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
