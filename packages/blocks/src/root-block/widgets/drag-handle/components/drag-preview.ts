import { ShadowlessElement } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import type { TemplateResult } from 'lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { Point } from '../../../../_common/utils/index.js';

@customElement('affine-drag-preview')
export class DragPreview extends ShadowlessElement {
  offset: Point;

  @property({ attribute: false })
  template: TemplateResult | null = null;

  @property({ attribute: false })
  onRemove: (() => void) | null = null;

  constructor(offset?: Point) {
    super();
    this.offset = offset ?? new Point(0, 0);
  }

  override disconnectedCallback() {
    if (this.onRemove) {
      this.onRemove();
    }
    super.disconnectedCallback();
  }

  override render() {
    return html`<style>
        affine-drag-preview {
          box-sizing: border-box;
          position: absolute;
          display: block;
          height: auto;
          font-family: ${baseTheme.fontSansFamily};
          font-size: var(--affine-font-base);
          line-height: var(--affine-line-height);
          color: var(--affine-text-primary-color);
          font-weight: 400;
          top: 0;
          left: 0;
          transform-origin: 0 0;
          opacity: 0.5;
          user-select: none;
          pointer-events: none;
          caret-color: transparent;
          z-index: 3;
        }

        .affine-drag-preview-grabbing * {
          cursor: grabbing !important;
        }</style
      >${this.template}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-drag-preview': DragPreview;
  }
}
