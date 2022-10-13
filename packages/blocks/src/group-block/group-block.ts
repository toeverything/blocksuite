import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  BLOCK_ID_ATTR,
  commonPassCursorHandler,
  type BlockHost,
} from '@blocksuite/shared';

import type { GroupBlockModel } from './group-model';
import { BlockChildrenContainer } from '../__internal__';
import style from './style.css';

@customElement('group-block')
export class GroupBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: GroupBlockModel;

  @property()
  host!: BlockHost;

  @state()
  selected = false;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
    this.host.selection.addBlockSelectedListener(
      this.model.id,
      selectionOptions => {
        const selectionInfo = this.host.selection.selectionInfo;
        if (selectionInfo.type === 'Block') {
          this.selected = selectionInfo.blocks.some(
            block => block.id === this.model.id
          );
        }
        if (this.selected && selectionInfo.type !== 'Block') {
          this.selected = false;
        }
        commonPassCursorHandler(
          this.model.id,
          this.host.selection,
          selectionOptions
        );
      }
    );
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this.host);

    return html`
      <div
        class="affine-group-block-container ${this.selected ? 'selected' : ''}"
      >
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'group-block': GroupBlockComponent;
  }
}
