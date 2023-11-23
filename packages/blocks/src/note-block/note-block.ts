/// <reference types="vite/client" />
import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { KeymapController } from './keymap-controller.js';
import type { NoteBlockModel } from './note-model.js';

@customElement('affine-note')
export class NoteBlockComponent extends BlockElement<NoteBlockModel> {
  static override styles = css`
    .affine-note-block-container {
      display: flow-root;
      position: relative;
    }
    .affine-note-block-container.selected {
      background-color: var(--affine-hover-color);
    }
  `;

  keymapController = new KeymapController(this);

  override connectedCallback() {
    super.connectedCallback();
    this.keymapController.bind();
  }

  override firstUpdated() {
    this._disposables.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );
    this._disposables.add(
      this.model.childrenUpdated.on(() => this.requestUpdate())
    );
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
