import { expect, test, vi } from 'vitest';

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

  root.count = 1;
  expect(onPropsUpdated).toBeCalledTimes(1);

  root.count = 2;
  expect(onPropsUpdated).toBeCalledTimes(2);

  root.style.color = 'blue';
  expect(onPropsUpdated).toBeCalledTimes(3);

  root.style = { color: 'red' };
  expect(onPropsUpdated).toBeCalledTimes(4);

  root.style.color = 'green';
  expect(onPropsUpdated).toBeCalledTimes(5);
});
