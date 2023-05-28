/// <reference types="vite/client" />
import '../__internal__/rich-text/rich-text.js';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '@blocksuite/global/config';
import { BlockElement } from '@blocksuite/lit';
import { assertExists } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { getPageBlock } from '../__internal__/index.js';
import { attributeRenderer } from '../__internal__/rich-text/virgo/attribute-renderer.js';
import {
  affineTextAttributes,
  type AffineTextSchema,
} from '../__internal__/rich-text/virgo/types.js';
import { registerService } from '../__internal__/service.js';
import { DefaultPageBlockComponent } from '../index.js';
import type { ListBlockModel } from './list-model.js';
import { ListBlockService } from './list-service.js';
import { ListIcon } from './utils/get-list-icon.js';
import { getListInfo } from './utils/get-list-info.js';

@customElement('affine-list')
export class ListBlockComponent extends BlockElement<ListBlockModel> {
  static override styles = css`
    .affine-list-block-container {
      box-sizing: border-box;
      border-radius: 5px;
      margin-top: 2px;
    }
    .affine-list-block-container--first {
      margin-top: var(--affine-paragraph-space);
    }
    .affine-list-block-container .affine-list-block-container {
      margin-top: 0;
    }
    .affine-list-block-container.selected {
      background-color: var(--affine-hover-color);
    }
    .affine-list-rich-text-wrapper {
      display: flex;
      align-items: center;
    }
    .affine-list-rich-text-wrapper rich-text {
      flex: 1;
    }

    .affine-list-block__prefix {
      flex-shrink: 0;
      min-width: 26px;
      height: 26px;
      margin-right: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      align-self: flex-start;
      color: var(--affine-code-color);
      font-size: 14px;
      line-height: var(--affine-line-height);
      user-select: none;
    }
    .affine-list-block__todo-prefix {
      cursor: pointer;
    }
    .affine-list-block__todo {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid var(--affine-icon-color);
    }
    .affine-list-block__todo.affine-list-block__todo--active {
      background: var(--affine-icon-color);
    }

    .affine-list--checked {
      color: var(--affine-icon-color);
    }
  `;

  @state()
  showChildren = true;

  readonly textSchema: AffineTextSchema = {
    attributesSchema: affineTextAttributes,
    textRenderer: attributeRenderer,
  };

  private _select() {
    const pageBlock = getPageBlock(this.model);
    assertExists(pageBlock);
    if (pageBlock instanceof DefaultPageBlockComponent) {
      pageBlock.selection.selectOneBlock(this);
    }
  }

  private _onClickIcon = (e: MouseEvent) => {
    e.stopPropagation();

    if (this.model.type === 'toggle') {
      this.showChildren = !this.showChildren;
      return;
    } else if (this.model.type === 'todo') {
      this.model.page.captureSync();
      const checkedPropObj = { checked: !this.model.checked };
      this.model.page.updateBlock(this.model, checkedPropObj);
      return;
    }
    this._select();
  };

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:list', ListBlockService);
  }

  override render() {
    const { deep, index } = getListInfo(this.model);
    const { model, showChildren, _onClickIcon } = this;
    const listIcon = ListIcon(model, index, deep, showChildren, _onClickIcon);

    // For the first list item, we need to add a margin-top to make it align with the text
    const shouldAddMarginTop = index === 0 && deep === 0;

    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.content}
    </div>`;

    return html`
      <div
        class=${`affine-list-block-container ${
          shouldAddMarginTop ? 'affine-list-block-container--first' : ''
        }`}
      >
        <div
          class=${`affine-list-rich-text-wrapper ${
            this.model.checked ? 'affine-list--checked' : ''
          }`}
        >
          ${listIcon}
          <rich-text
            .model=${this.model}
            .textSchema=${this.textSchema}
          ></rich-text>
        </div>
        ${this.showChildren ? children : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-list': ListBlockComponent;
  }
}
