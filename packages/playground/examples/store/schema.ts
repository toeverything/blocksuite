import { type SchemaToModel, defineBlockSchema } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

const TodoRootBlockSchema = defineBlockSchema({
  flavour: 'todo:root',
  metadata: {
    role: 'root',
    version: 1,
  },
});

const TodoContainerBlockSchema = defineBlockSchema({
  flavour: 'todo:container',
  metadata: {
    role: 'hub',
    tag: literal`todo-container`,
    version: 1,
  },
});

const TodoItemBlockSchema = defineBlockSchema({
  flavour: 'todo:item',
  metadata: {
    parent: ['todo:container'],
    role: 'content',
    tag: literal`todo-item`,
    version: 1,
  },
  props: () => ({
    content: '',
    done: false,
  }),
});

export const TodoSchema = [
  TodoRootBlockSchema,
  TodoContainerBlockSchema,
  TodoItemBlockSchema,
];
export type TodoRootBlockModel = SchemaToModel<typeof TodoRootBlockSchema>;
export type TodoContainerBlockModel = SchemaToModel<
  typeof TodoContainerBlockSchema
>;
export type TodoItemBlockModel = SchemaToModel<typeof TodoItemBlockSchema>;

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'todo:container': TodoContainerBlockModel;
      'todo:item': TodoItemBlockModel;
      'todo:root': TodoRootBlockModel;
    }
  }
}
