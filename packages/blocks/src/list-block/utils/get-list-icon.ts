import { html } from 'lit';

import type { ListBlockModel } from '../list-model.js';
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
  index: number,
  depth: number,
  showChildren: boolean,
  onClick: (e: MouseEvent) => void
) {
  const icon = (() => {
    switch (model.type) {
      case 'bulleted':
        return points[depth % points.length];
      case 'numbered':
        return getNumberPrefix(depth, index);
      case 'todo':
        return model.checked ? checkboxChecked() : checkboxUnchecked();
      case 'toggle':
        return showChildren
          ? toggleDown()
          : toggleRight(model.children.length > 0);
      default:
        return '';
    }
  })();

  return html`
    <div
      class="affine-list-block__prefix ${model.type === 'todo'
        ? 'affine-list-block__todo-prefix'
        : ''}"
      @mousedown="${(e: MouseEvent) => onClick(e)}"
    >
      ${icon}
    </div>
  `;
}
