import { expect, test, vi } from 'vitest';
import * as Y from 'yjs';

import type { SchemaToModel } from '../schema/index.js';
import { defineBlockSchema, Schema } from '../schema/index.js';
import { Generator, Workspace } from '../workspace/index.js';

const pageSchema = defineBlockSchema({
  flavour: 'page',
  props: internal => ({
    title: internal.Text(),
    count: 0,
    style: {} as Record<string, unknown>,
    items: [] as unknown[],
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

test('trigger props updated', () => {
  const options = createTestOptions();
  const workspace = new Workspace(options);

  const page = workspace.createPage({ id: 'home' });
  page.load();

  page.addBlock('page');

  const root = page.root as PageBlockModel;

  expect(root).not.toBeNull();

  const onPropsUpdated = vi.fn();
  root.propsUpdated.on(onPropsUpdated);

  const getColor = () =>
    (root.yBlock.get('prop:style') as Y.Map<string>).get('color');

  const getItems = () => root.yBlock.get('prop:items') as Y.Array<unknown>;
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

  root.items.push(1);
  expect(onPropsUpdated).toBeCalledTimes(6);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(6, { key: 'items' });
  expect(getItems().get(0)).toBe(1);

  root.items[0] = { id: '1' };
  expect(onPropsUpdated).toBeCalledTimes(7);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(7, { key: 'items' });
  expect(getItems().get(0)).toBeInstanceOf(Y.Map);
  expect((getItems().get(0) as Y.Map<unknown>).get('id')).toBe('1');
});

test('stash and pop', () => {
  const options = createTestOptions();
  const workspace = new Workspace(options);

  const page = workspace.createPage({ id: 'home' });
  page.load();

  page.addBlock('page');

  const root = page.root as PageBlockModel;

  expect(root).not.toBeNull();

  const onPropsUpdated = vi.fn();
  root.propsUpdated.on(onPropsUpdated);

  const getCount = () => root.yBlock.get('prop:count');
  const getColor = () =>
    (root.yBlock.get('prop:style') as Y.Map<string>).get('color');

  root.count = 1;
  expect(onPropsUpdated).toBeCalledTimes(1);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(1, { key: 'count' });
  expect(getCount()).toBe(1);

  root.stash('count');
  root.count = 2;
  expect(onPropsUpdated).toBeCalledTimes(3);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(3, { key: 'count' });
  expect(root.yBlock.get('prop:count')).toBe(1);

  root.pop('count');
  expect(onPropsUpdated).toBeCalledTimes(4);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(4, { key: 'count' });
  expect(root.yBlock.get('prop:count')).toBe(2);

  root.style.color = 'blue';
  expect(getColor()).toBe('blue');
  expect(onPropsUpdated).toBeCalledTimes(5);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(5, { key: 'style' });

  root.stash('style');
  root.style = {
    color: 'red',
  };
  expect(getColor()).toBe('blue');
  expect(onPropsUpdated).toBeCalledTimes(7);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(7, { key: 'style' });

  root.pop('style');
  expect(getColor()).toBe('red');
  expect(onPropsUpdated).toBeCalledTimes(8);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(8, { key: 'style' });

  root.stash('style');
  expect(onPropsUpdated).toBeCalledTimes(9);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(9, { key: 'style' });

  root.style.color = 'green';
  expect(onPropsUpdated).toBeCalledTimes(10);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(10, { key: 'style' });
  expect(getColor()).toBe('red');

  root.pop('style');
  expect(getColor()).toBe('green');
  expect(onPropsUpdated).toBeCalledTimes(11);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(11, { key: 'style' });
});

test('always get latest value in onChange', () => {
  const options = createTestOptions();
  const workspace = new Workspace(options);

  const page = workspace.createPage({ id: 'home' });
  page.load();

  page.addBlock('page');

  const root = page.root as PageBlockModel;

  expect(root).not.toBeNull();

  let value: unknown;
  root.propsUpdated.on(({ key }) => {
    // @ts-ignore
    value = root[key];
  });

  root.count = 1;
  expect(value).toBe(1);

  root.stash('count');

  root.count = 2;
  expect(value).toBe(2);

  root.pop('count');

  root.count = 3;
  expect(value).toBe(3);

  root.style.color = 'blue';
  expect(value).toEqual({ color: 'blue' });

  root.stash('style');
  root.style = { color: 'red' };
  expect(value).toEqual({ color: 'red' });
  root.style.color = 'green';
  expect(value).toEqual({ color: 'green' });

  root.pop('style');
  root.style.color = 'yellow';
  expect(value).toEqual({ color: 'yellow' });
});
