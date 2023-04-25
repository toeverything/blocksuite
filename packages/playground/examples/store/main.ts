import { type Page, Workspace } from '@blocksuite/store';

import {
  type TodoContainerBlockModel,
  type TodoItemBlockModel,
  TodoSchema,
} from './schema';

function initPage() {
  const workspace = new Workspace({ id: 'todo' });
  workspace.register(TodoSchema);
  const page = workspace.createPage({ id: 'page0' });
  page.addBlock('todo:container');
  return page;
}

function bindEvents(page: Page, container: TodoContainerBlockModel) {
  const addInput = document.querySelector('.input-add') as HTMLInputElement;
  const addButton = document.querySelector('.button-add') as HTMLButtonElement;
  const containerDiv = document.querySelector('.container') as HTMLDivElement;
  addButton.addEventListener('click', () => {
    const content = addInput.value;
    if (content !== '') {
      const id = page.addBlock('todo:item', { content }, container);
      const todoItemBlock = page.getBlockById(id) as TodoItemBlockModel;
      todoItemBlock.propsUpdated.on(() => {
        render(container);
      });
      addInput.value = '';
      addInput.focus();
    }
  });
  containerDiv.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('button-done')) {
      const todoItemBlock = page.getBlockById(
        target.parentElement?.dataset.id as string
      ) as TodoItemBlockModel;
      page.updateBlock(todoItemBlock, { done: !todoItemBlock.done });
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
  const page = initPage();
  const container = page.getBlockByFlavour(
    'todo:container'
  )[0] as TodoContainerBlockModel;
  bindEvents(page, container);
  container.childrenUpdated.on(() => {
    render(container);
  });
}

main();
