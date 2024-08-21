import type { ListBlockModel } from '@blocksuite/affine-model';

import {
  BulletIcons,
  checkboxChecked,
  checkboxUnchecked,
  toggleDown,
  toggleRight,
} from '@blocksuite/affine-components/icons';
import { html } from 'lit';

import { getNumberPrefix } from './get-number-prefix.js';

const getListDeep = (model: ListBlockModel): number => {
  let deep = 0;
  let parent = model.doc.getParent(model);
  while (parent?.flavour === model.flavour) {
    deep++;
    parent = model.doc.getParent(parent);
  }
  return deep;
};

export function getListIcon(
  model: ListBlockModel,
  showChildren: boolean,
  onClick: (e: MouseEvent) => void
) {
  const deep = getListDeep(model);
  switch (model.type) {
    case 'bulleted':
      return html`<div
        contenteditable="false"
        class="affine-list-block__prefix"
        @click=${onClick}
      >
        ${BulletIcons[deep % BulletIcons.length]}
      </div>`;
    case 'numbered':
      return html`<div
        contenteditable="false"
        class="affine-list-block__prefix affine-list-block__numbered"
        @click=${onClick}
      >
        ${model.order ? getNumberPrefix(model.order, deep) : '1.'}
      </div>`;
    case 'todo':
      return html`<div
        contenteditable="false"
        class=${`affine-list-block__prefix affine-list-block__todo-prefix ${model.doc.readonly ? 'readonly' : ''}`}
        @click=${onClick}
      >
        ${model.checked ? checkboxChecked() : checkboxUnchecked()}
      </div>`;
    case 'toggle':
      return html`<div
        contenteditable="false"
        class="affine-list-block__prefix"
        @click=${onClick}
      >
        ${showChildren ? toggleDown : toggleRight}
      </div>`;
    default:
      console.error('Unknown list type', model.type, model);
      return null;
  }
}
