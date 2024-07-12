import { type SchemaToModel, defineBlockSchema } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

const TodoRootBlockSchema = defineBlockSchema({
  flavour: 'todo:root',
  metadata: {
    version: 1,
    role: 'root',
  },
});

const TodoContainerBlockSchema = defineBlockSchema({
  flavour: 'todo:container',
  metadata: {
    version: 1,
    role: 'hub',
    tag: literal`todo-container`,
  },
});

const TodoItemBlockSchema = defineBlockSchema({
  flavour: 'todo:item',
  props: () => ({
    content: '',
    done: false,
  }),
  metadata: {
    version: 1,
    role: 'content',
    tag: literal`todo-item`,
    parent: ['todo:container'],
  },
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
      'todo:root': TodoRootBlockModel;
      'todo:container': TodoContainerBlockModel;
      'todo:item': TodoItemBlockModel;
    }
  }
}
