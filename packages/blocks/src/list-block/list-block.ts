/// <reference types="vite/client" />
import '../components/rich-text/rich-text.js';

import { assertExists } from '@blocksuite/global/utils';
import { BlockElement, getVRangeProvider } from '@blocksuite/lit';
import type { VRangeProvider } from '@blocksuite/virgo';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../__internal__/consts.js';
import { bindContainerHotkey } from '../components/rich-text/keymap/index.js';
import type { RichText } from '../components/rich-text/rich-text.js';
import { affineAttributeRenderer } from '../components/rich-text/virgo/attribute-renderer.js';
import { affineTextAttributes } from '../components/rich-text/virgo/types.js';
import type { ListBlockModel } from './list-model.js';
import { styles } from './styles.js';
import { ListIcon } from './utils/get-list-icon.js';
import { getListInfo } from './utils/get-list-info.js';
import { playCheckAnimation, toggleDown, toggleRight } from './utils/icons.js';

@customElement('affine-list')
export class ListBlockComponent extends BlockElement<ListBlockModel> {
  static override styles = styles;

  readonly attributesSchema = affineTextAttributes;
  readonly attributeRenderer = affineAttributeRenderer;

  private _select() {
    const selection = this.root.selection;
    selection.update(selList => {
      return selList
        .filter(sel => !sel.is('text') && !sel.is('block'))
        .concat(selection.getInstance('block', { path: this.path }));
    });
  }

  private _onClickIcon = (e: MouseEvent) => {
    e.stopPropagation();

    if (this.model.type === 'toggle') {
      this._toggleChildren();
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

  private _vRangeProvider: VRangeProvider | null = null;

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

    this._vRangeProvider = getVRangeProvider(this);
  }

  private _toggleChildren() {
    this.page.captureSync();
    this.page.updateBlock(this.model, {
      collapsed: !this.model.collapsed,
    } as Partial<ListBlockModel>);
  }

  private _toggleTemplate() {
    const noChildren = this.model.children.length === 0;
    const toggleDownTemplate = html`<div
      class="toggle-icon"
      @click=${this._toggleChildren}
    >
      ${toggleDown}
    </div>`;

    const toggleRightTemplate = html`<div
      class="toggle-icon toggle-icon__collapsed"
      @click=${this._toggleChildren}
    >
      ${toggleRight}
    </div>`;
    const toggleIcon = noChildren
      ? nothing
      : !this.model.collapsed
      ? toggleDownTemplate
      : toggleRightTemplate;
    return toggleIcon;
  }

  override render(): TemplateResult<1> {
    const { deep, index } = getListInfo(this.model);
    const { model, _onClickIcon } = this;
    const listIcon = ListIcon(
      model,
      index,
      deep,
      !this.model.collapsed,
      _onClickIcon
    );

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
          ${this._toggleTemplate()} ${listIcon}
          <rich-text
            .yText=${this.model.text.yText}
            .undoManager=${this.model.page.history}
            .attributeRenderer=${this.attributeRenderer}
            .attributesSchema=${this.attributesSchema}
            .readonly=${this.model.page.readonly}
            .vRangeProvider=${this._vRangeProvider}
            .enableClipboard=${false}
            .enableUndoRedo=${false}
          ></rich-text>
        </div>
        ${!this.model.collapsed ? children : nothing}
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
