import { expect, test } from 'vitest';
import * as Y from 'yjs';

import { defineBlockSchema, Schema } from '../schema/index.js';
import { Block } from '../workspace/block/block.js';

const schema = new Schema();
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
schema.register([pageSchema]);

test('init block without props should add default props', async () => {
  const doc = new Y.Doc();
  const yBlock = doc.getMap('yBlock');
  yBlock.set('sys:id', '0');
  yBlock.set('sys:flavour', 'page');
  yBlock.set('sys:children', new Y.Array());

  const block = new Block(schema, yBlock);

  expect(yBlock.get('prop:count')).toBe(0);
  expect(block.model.count).toBe(0);
  expect(block.model.style).toEqual({});
});
