import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

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
  },
});

export const TodoSchema = [TodoContainerBlockSchema, TodoItemBlockSchema];
export type TodoContainerBlockModel = SchemaToModel<
  typeof TodoContainerBlockSchema
>;
export type TodoItemBlockModel = SchemaToModel<typeof TodoItemBlockSchema>;
