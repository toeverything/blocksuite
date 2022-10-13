import { ListBlockModel } from '../list-model';
import { points, checkboxChecked, checkboxUnchecked } from './icons';
import { getNumberPrefix } from './get-number-prefix';
import { html } from 'lit';

export function getListIcon({
  model,
  index,
  deep,
}: {
  model: ListBlockModel;
  index: number;
  deep: number;
}) {
  return html`<div class="affine-list-block__prefix">
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
