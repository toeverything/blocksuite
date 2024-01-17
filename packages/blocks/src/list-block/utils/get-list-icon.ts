import { html } from 'lit';

import type { ListBlockModel } from '../list-model.js';
import { getListInfo } from './get-list-info.js';
import { getNumberPrefix } from './get-number-prefix.js';
import {
  checkboxChecked,
  checkboxUnchecked,
  points,
  toggleDown,
  toggleRight,
} from './icons.js';

export function ListIcon(
  model: ListBlockModel,
  showChildren: boolean,
  onClick: (e: MouseEvent) => void
) {
  const { index, deep } = getListInfo(model);
  switch (model.type) {
    case 'bulleted':
      return html`<div class="affine-list-block__prefix" @click=${onClick}>
        ${points[deep % points.length]}
      </div>`;
    case 'numbered':
      return html`<div
        class="affine-list-block__prefix affine-list-block__numbered"
        @click=${onClick}
      >
        ${getNumberPrefix(index, deep)}
      </div>`;
    case 'todo':
      return html`<div
        class="affine-list-block__prefix affine-list-block__todo-prefix"
        @click=${onClick}
      >
        ${model.checked ? checkboxChecked() : checkboxUnchecked()}
      </div>`;
    case 'toggle':
      return html`<div class="affine-list-block__prefix" @click=${onClick}>
        ${showChildren ? toggleDown : toggleRight}
      </div>`;
    default:
      console.error('Unknown list type', model.type, model);
      return null;
  }
}
