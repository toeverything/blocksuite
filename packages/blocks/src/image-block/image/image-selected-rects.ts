import { html } from 'lit';

export function ImageSelectedRectsContainer() {
  return html`
    <style>
      .affine-page-selected-embed-rects-container {
        position: absolute;
        border: 2px solid var(--affine-primary-color);
        left: 0;
        top: 0;
        width: 100%;
        height: calc(100% + 1px);
        user-select: none;
        pointer-events: none;
        box-sizing: border-box;
        line-height: 0;
      }

      .affine-page-selected-embed-rects-container .resize {
        /* display: none; */
        width: 10px;
        height: 10px;
        border-radius: 50%; /*magic to turn square into circle*/
        background: white;
        border: 2px solid var(--affine-primary-color);
        position: absolute;
        pointer-events: auto;
      }

      .resizable .resize.top-left {
        left: -5px;
        top: -5px;
        cursor: nwse-resize; /*resizer cursor*/
      }
      .resizable .resize.top-right {
        right: -5px;
        top: -5px;
        cursor: nesw-resize;
      }
      .resizable .resize.bottom-left {
        left: -5px;
        bottom: -5px;
        cursor: nesw-resize;
      }
      .resizable .resize.bottom-right {
        right: -5px;
        bottom: -5px;
        cursor: nwse-resize;
      }
    </style>
    <div class="affine-page-selected-embed-rects-container resizable resizes">
      <div class="resize top-left"></div>
      <div class="resize top-right"></div>
      <div class="resize bottom-left"></div>
      <div class="resize bottom-right"></div>
    </div>
  `;
}
