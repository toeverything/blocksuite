import { expect, test, vi } from 'vitest';
import type * as Y from 'yjs';

import type { SchemaToModel } from '../schema/index.js';
import { defineBlockSchema, Schema } from '../schema/index.js';
import { Generator, Workspace } from '../workspace/index.js';

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

type PageBlockModel = SchemaToModel<typeof pageSchema>;

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register([pageSchema]);
  return { id: 'test-workspace', idGenerator, schema };
}

test('trigger props updated', async () => {
  const options = createTestOptions();
  const workspace = new Workspace(options);

  const page = workspace.createPage({ id: 'home' });
  await page.load();

  page.addBlock('page');

  const root = page.root as PageBlockModel;

  expect(root).not.toBeNull();

  const onPropsUpdated = vi.fn();
  root.propsUpdated.on(onPropsUpdated);

  const getColor = () =>
    (root.yBlock.get('prop:style') as Y.Map<string>).get('color');
  const getCount = () => root.yBlock.get('prop:count');

  root.count = 1;
  expect(onPropsUpdated).toBeCalledTimes(1);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(1, { key: 'count' });
  expect(getCount()).toBe(1);

  root.count = 2;
  expect(onPropsUpdated).toBeCalledTimes(2);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(2, { key: 'count' });
  expect(getCount()).toBe(2);

  root.style.color = 'blue';
  expect(onPropsUpdated).toBeCalledTimes(3);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(3, { key: 'style' });
  expect(getColor()).toBe('blue');

  root.style = { color: 'red' };
  expect(onPropsUpdated).toBeCalledTimes(4);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(4, { key: 'style' });
  expect(getColor()).toBe('red');

  root.style.color = 'green';
  expect(onPropsUpdated).toBeCalledTimes(5);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(5, { key: 'style' });
  expect(getColor()).toBe('green');
});
