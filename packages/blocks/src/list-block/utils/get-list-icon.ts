import { ListBlockModel } from '../list-model';
import { points } from './points';
import { getNumberPrefix } from './get-number-prefix';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

const listPrefixStyle = styleMap({
  flexShrink: '0',
  maxWidth: '26px',
  height: '26px',
  marginTop: '3px',
  marginRight: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  color: 'var(--affine-highlight-color)',
});

export function getListIcon({
  model,
  index,
  deep,
}: {
  model: ListBlockModel;
  index: number;
  deep: number;
}) {
  if (model.type === 'numbered') {
    return html`<div style="${listPrefixStyle}">
      ${getNumberPrefix({
        deep,
        index,
      })}
    </div>`;
  }

  return html`<div style="${listPrefixStyle}">
    ${points[deep % points.length]}
  </div>`;
}
