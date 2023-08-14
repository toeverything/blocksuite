import { html, type TemplateResult } from 'lit';

export function fontIcon(svg: TemplateResult<2>, baseSize = 20) {
  // assume 1em = 16px
  const size = baseSize / 16;
  // Control Icons with Font Size
  // Set the width and height to be 1em, which will be the font-size of its parent element
  // See https://css-tricks.com/control-icons-with-font-size/
  const fontIconStyle = `
    width: ${size}em;
    height: ${size}em;
    vertical-align: middle;
    font-size: inherit;
    margin-bottom: 0.1em;
  `;

  return html`<svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style=${fontIconStyle}
  >
    ${svg}
  </svg>`;
}

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
