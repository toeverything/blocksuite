import type { ListBlockModel } from '../list-model.js';
import {
  points,
  checkboxChecked,
  checkboxUnchecked,
  toggleRight,
  toggleDown,
} from './icons.js';
import { getNumberPrefix } from './get-number-prefix.js';
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
      // onClick?.(e);
      // console.log('skipping on click should do in mousedown instead');
    }}"
    @mousedown="${(e: MouseEvent) => {
      // console.log('preventing def icon div');
      onClick?.(e);
      // e.stopPropagation();
      // e.preventDefault();
    }}"
  >
    ${(() => {
      const blocksWithHiddenChildren =
        model.page.awarenessStore.getFlag('blocks_with_hidden_children') ?? [];
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
        case 'toggle':
          return blocksWithHiddenChildren.includes(model.id)
            ? toggleRight(!!model.children.length)
            : toggleDown();
        default:
          return '';
      }
    })()}
  </div>`;
}
