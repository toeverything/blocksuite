import { ShadowlessElement } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('affine-drag-preview')
export class DragPreview extends ShadowlessElement {
  override render() {
    return html`<style>
      affine-drag-preview {
        --x: 0px;
        --y: 0px;
        height: auto;
        display: block;
        position: absolute;
        box-sizing: border-box;
        font-family: ${baseTheme.fontSansFamily};
        font-size: var(--affine-font-base);
        line-height: var(--affine-line-height);
        color: var(--affine-text-primary-color);
        font-weight: 400;
        top: 0;
        left: 0;
        opacity: 0.843;
        cursor: none;
        user-select: none;
        pointer-events: none;
        caret-color: transparent;
        transform-origin: 0 0;
        z-index: 2;
      }

      affine-drag-preview > .affine-block-element {
        pointer-events: none;
        background-color: transparent;
      }

      affine-drag-preview > .affine-block-element:first-child > *:first-child {
        margin-top: 0;
      }

      affine-drag-preview.grabbing {
        cursor: grabbing;
        /*pointer-events: auto;*/
      }

      affine-drag-preview.grabbing:after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        transform: translate(var(--x), var(--y));
      }
    </style>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-drag-preview': DragPreview;
  }
}
