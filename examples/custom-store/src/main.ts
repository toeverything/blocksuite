import { type Doc, DocCollection, Schema } from '@blocksuite/store';

import {
  type TodoContainerBlockModel,
  type TodoItemBlockModel,
  TodoSchema,
} from './schema';

function initDoc() {
  const schema = new Schema();
  schema.register(TodoSchema);
  const workspace = new DocCollection({ schema });
  workspace.meta.initialize();
  const doc = workspace.createDoc({ id: 'doc:home' });
  doc.load(() => {
    const rootId = doc.addBlock('todo:root');
    doc.addBlock('todo:container', {}, rootId);
  });
  return doc;
}

function bindEvents(doc: Doc, container: TodoContainerBlockModel) {
  const addInput = document.querySelector('.input-add') as HTMLInputElement;
  const addButton = document.querySelector('.button-add') as HTMLButtonElement;
  const containerDiv = document.querySelector('.container') as HTMLDivElement;
  addButton.addEventListener('click', () => {
    const content = addInput.value;
    if (content !== '') {
      const id = doc.addBlock('todo:item', { content }, container);
      const todoItemBlock = doc.getBlockById(id) as TodoItemBlockModel;
      todoItemBlock.propsUpdated.on(() => {
        render(container);
      });

      render(container);
      addInput.value = '';
      addInput.focus();
    }
  });
  containerDiv.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('button-done')) {
      const todoItemBlock = doc.getBlockById(
        target.parentElement?.dataset.id as string
      ) as TodoItemBlockModel;
      doc.updateBlock(todoItemBlock, { done: !todoItemBlock.done });
    }
  });
}

function todoItemTemplate(todo: TodoItemBlockModel) {
  return `<div class="todo-item" data-id="${todo.id}">
  <button class="button-done">done</button>
  <span class="content ${todo.done ? 'done' : ''}">${todo.content}</span>
</div>`;
}

function render(container: TodoContainerBlockModel) {
  const todoBlocks = container.children as Array<TodoItemBlockModel>;
  const todoDivs = todoBlocks
    .map((block: TodoItemBlockModel) => todoItemTemplate(block))
    .join('\n');
  const containerDiv = document.querySelector('.container') as HTMLDivElement;
  containerDiv.innerHTML = todoDivs;
}

function main() {
  const doc = initDoc();
  const container = doc.getBlockByFlavour(
    'todo:container'
  )[0] as TodoContainerBlockModel;
  bindEvents(doc, container);
  render(container);
}

main();
