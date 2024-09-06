import { html, type TemplateResult } from 'lit';

export function icon(svg: TemplateResult<2>, size = 24) {
  return html`<svg
    width="${size}"
    height="${size}"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    ${svg}
  </svg>`;
}
