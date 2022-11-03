import type { ListBlockModel } from '../list-model';
import { points, checkboxChecked, checkboxUnchecked } from './icons';
import { getNumberPrefix } from './get-number-prefix';
import { html } from 'lit';

export function getListIcon({
  model,
  index,
  deep,
  onClick,
}: {
  model: ListBlockModel;
  index: number;
  deep: number;
  onClick?: (e: MouseEvent) => void;
}) {
  return html`<div
    class="affine-list-block__prefix ${model.type === 'todo'
      ? 'affine-list-block__todo-prefix'
      : ''}"
    @click="${(e: MouseEvent) => {
      onClick?.(e);
    }}"
  >
    ${(() => {
      switch (model.type) {
        case 'bulleted':
          return points[deep % points.length];
        case 'numbered':
          return getNumberPrefix({
            deep,
            index,
          });
        case 'todo':
          return model.checked ? checkboxChecked() : checkboxUnchecked();
        default:
          return '';
      }
    })()}
  </div>`;
}
