/// <reference types="vite/client" />
import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { registerService } from '../__internal__/service/index.js';
import { bindHotKey } from './keymap.js';
import type { NoteBlockModel } from './note-model.js';
import { NoteBlockService } from './note-service.js';

@customElement('affine-note')
export class NoteBlockComponent extends BlockElement<NoteBlockModel> {
  static override styles = css`
    .affine-note-block-container {
      display: flow-root;
    }
    .affine-note-block-container.selected {
      background-color: var(--affine-hover-color);
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:note', NoteBlockService);
    bindHotKey(this);
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  override render() {
    return html`
      <div class="affine-note-block-container">
        <div class="affine-block-children-container">${this.content}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-note': NoteBlockComponent;
  }
}
