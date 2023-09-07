/// <reference types="vite/client" />
import '../__internal__/rich-text/rich-text.js';

import { assertExists } from '@blocksuite/global/utils';
import { BlockElement, getVRangeProvider } from '@blocksuite/lit';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../__internal__/consts.js';
import { bindContainerHotkey } from '../__internal__/rich-text/keymap/index.js';
import type { RichText } from '../__internal__/rich-text/rich-text.js';
import { attributeRenderer } from '../__internal__/rich-text/virgo/attribute-renderer.js';
import {
  affineTextAttributes,
  type AffineTextSchema,
} from '../__internal__/rich-text/virgo/types.js';
import type { ListBlockModel } from './list-model.js';
import { styles } from './styles.js';
import { ListIcon } from './utils/get-list-icon.js';
import { getListInfo } from './utils/get-list-info.js';
import { playCheckAnimation } from './utils/icons.js';

@customElement('affine-list')
export class ListBlockComponent extends BlockElement<ListBlockModel> {
  static override styles = styles;

  @state()
  showChildren = true;

  readonly textSchema: AffineTextSchema = {
    attributesSchema: affineTextAttributes,
    textRenderer: attributeRenderer,
  };

  private _select() {
    const selection = this.root.selectionManager;
    selection.update(selList => {
      return selList
        .filter(sel => !sel.is('text') && !sel.is('block'))
        .concat(selection.getInstance('block', { path: this.path }));
    });
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
      if (this.model.checked) {
        const checkEl = this.querySelector('.affine-list-block__todo-prefix');
        assertExists(checkEl);
        playCheckAnimation(checkEl);
      }
      return;
    }
    this._select();
  };

  @query('rich-text')
  private _richTextElement?: RichText;

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  override connectedCallback() {
    super.connectedCallback();
    bindContainerHotkey(this);
  }

  override render(): TemplateResult<1> {
    const { deep, index } = getListInfo(this.model);
    const { model, showChildren, _onClickIcon } = this;
    const listIcon = ListIcon(model, index, deep, showChildren, _onClickIcon);

    // For the first list item, we need to add a margin-top to make it align with the text
    const shouldAddMarginTop = index === 0 && deep === 0;
    const top = shouldAddMarginTop ? 'affine-list-block-container--first' : '';
    const checked =
      this.model.type === 'todo' && this.model.checked
        ? 'affine-list--checked'
        : '';

    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.content}
    </div>`;

    return html`
      <div class=${`affine-list-block-container ${top}`}>
        <div class=${`affine-list-rich-text-wrapper ${checked}`}>
          ${listIcon}
          <rich-text
            .yText=${this.model.text.yText}
            .undoManager=${this.model.page.history}
            .textSchema=${this.textSchema}
            .readonly=${this.model.page.readonly}
            .vRangeProvider=${getVRangeProvider(this)}
          ></rich-text>
        </div>
        ${this.showChildren ? children : nothing}
        ${when(
          this.selected?.is('block'),
          () => html`<affine-block-selection></affine-block-selection>`
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-list': ListBlockComponent;
  }
}
