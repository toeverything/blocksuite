/// <reference types="vite/client" />
import '../__internal__/rich-text/rich-text.js';

import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { attributeRenderer } from '../__internal__/rich-text/virgo/attribute-renderer.js';
import {
  affineTextAttributes,
  type AffineTextSchema,
} from '../__internal__/rich-text/virgo/types.js';
import { registerService } from '../__internal__/service.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
import { BookmarkBlockService } from './bookmark-service.js';

@customElement('affine-bookmark')
export class BookmarkBlockComponent extends BlockElement<BookmarkBlockModel> {
  static override styles = css`
    .affine-bookmark-block-container {
      width: 100%;
      height: 112px;
      background: linear-gradient(180deg, #f0f3fd 0%, #fcfcfd 100%);
      border: 3px solid #fcfcfd;
      box-shadow: 0 0 4px rgba(66, 65, 73, 0.14);
      border-radius: 12px;
    }
  `;

  @state()
  showChildren = true;

  readonly textSchema: AffineTextSchema = {
    attributesSchema: affineTextAttributes,
    textRenderer: attributeRenderer,
  };

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
  }

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:bookmark', BookmarkBlockService);
  }

  override render() {
    return html`<div class=${`affine-bookmark-block-container`}>
      ${this.model.link}
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
