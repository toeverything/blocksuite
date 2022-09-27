import { html } from 'lit';
import type { ListBlockModel } from './list-model';

export function getListIcon(model: ListBlockModel) {
  const positionStyle =
    'width: 24px; height: 24px; position: absolute; left: 0; top: 0;';
  const numberStyle = `font-size: 12px; line-height: 24px; text-align: center;`;

  if (model.type === 'numbered') {
    // TODO support dynamic numbering
    return html` <div style="${positionStyle} ${numberStyle}">1.</div> `;
  }

  return html`
    <svg
      style="${positionStyle}"
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  `;
}
