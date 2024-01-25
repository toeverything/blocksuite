/// <reference types="vite/client" />
import '../_common/components/rich-text/rich-text.js';

import { assertExists } from '@blocksuite/global/utils';
import type { InlineRangeProvider } from '@blocksuite/inline';
import { BlockElement, getInlineRangeProvider } from '@blocksuite/lit';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import type { RichText } from '../_common/components/rich-text/rich-text.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import type { NoteBlockComponent } from '../note-block/note-block.js';
import { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import type { ListBlockModel } from './list-model.js';
import type { ListService } from './list-service.js';
import { styles } from './styles.js';
import { ListIcon } from './utils/get-list-icon.js';
import { getListInfo } from './utils/get-list-info.js';
import { playCheckAnimation, toggleDown, toggleRight } from './utils/icons.js';

@customElement('affine-list')
export class ListBlockComponent extends BlockElement<
  ListBlockModel,
  ListService
> {
  static override styles = styles;

  get inlineManager() {
    const inlineManager = this.service?.inlineManager;
    assertExists(inlineManager);
    return inlineManager;
  }
  get attributesSchema() {
    return this.inlineManager.getSchema();
  }
  get attributeRenderer() {
    return this.inlineManager.getRenderer();
  }
  get markdownShortcutHandler() {
    return this.inlineManager.markdownShortcutHandler;
  }
  get embedChecker() {
    return this.inlineManager.embedChecker;
  }

  @state()
  private _isCollapsedWhenReadOnly = !!this.model?.collapsed;

  private _select() {
    const selection = this.host.selection;
    selection.update(selList => {
      return selList
        .filter(sel => !sel.is('text') && !sel.is('block'))
        .concat(selection.create('block', { path: this.path }));
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
        playCheckAnimation(checkEl).catch(console.error);
      }
      return;
    }
    this._select();
  };

  @query('rich-text')
  private _richTextElement?: RichText;

  private _inlineRangeProvider: InlineRangeProvider | null = null;

  override get topContenteditableElement() {
    if (this.rootBlockElement instanceof EdgelessPageBlockComponent) {
      const note = this.closest<NoteBlockComponent>('affine-note');
      return note;
    }
    return this.rootBlockElement;
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override firstUpdated() {
    this._updateFollowingListSiblings();
    this.model.childrenUpdated.on(() => {
      this._updateFollowingListSiblings();
    });
  }

  private _updateFollowingListSiblings() {
    this.updateComplete
      .then(() => {
        let current: BlockElement | undefined = this as BlockElement;
        while (current && current.tagName == 'AFFINE-LIST') {
          current.requestUpdate();
          current = this.std.view.findNext(current.path, () => {
            return true;
          })?.view as BlockElement;
        }
      })
      .catch(console.error);
  }

  override connectedCallback() {
    super.connectedCallback();

    bindContainerHotkey(this);

    this._inlineRangeProvider = getInlineRangeProvider(this);
  }

  private _toggleChildren() {
    if (this.page.readonly) {
      this._isCollapsedWhenReadOnly = !this._isCollapsedWhenReadOnly;
      return;
    }
    const newCollapsedState = !this.model.collapsed;
    this._isCollapsedWhenReadOnly = newCollapsedState;
    this.page.captureSync();
    this.page.updateBlock(this.model, {
      collapsed: newCollapsedState,
    } as Partial<ListBlockModel>);
  }

  private _toggleTemplate(isCollapsed: boolean) {
    const noChildren = this.model.children.length === 0;
    if (noChildren) return nothing;

    const toggleDownTemplate = html`<div
      contenteditable="false"
      class="toggle-icon"
      @click=${this._toggleChildren}
    >
      ${toggleDown}
    </div>`;

    const toggleRightTemplate = html`<div
      contenteditable="false"
      class="toggle-icon toggle-icon__collapsed"
      @click=${this._toggleChildren}
    >
      ${toggleRight}
    </div>`;

    return isCollapsed ? toggleRightTemplate : toggleDownTemplate;
  }

  override renderBlock(): TemplateResult<1> {
    const { deep, index } = getListInfo(this.model);
    const { model, _onClickIcon } = this;
    const collapsed = this.page.readonly
      ? this._isCollapsedWhenReadOnly
      : !!model.collapsed;
    const listIcon = ListIcon(model, !collapsed, _onClickIcon);

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
      ${this.renderModelChildren(this.model)}
    </div>`;

    return html`
      <div class=${`affine-list-block-container ${top}`}>
        <div class=${`affine-list-rich-text-wrapper ${checked}`}>
          ${this._toggleTemplate(collapsed)} ${listIcon}
          <rich-text
            .yText=${this.model.text.yText}
            .inlineEventSource=${this.topContenteditableElement ?? nothing}
            .undoManager=${this.model.page.history}
            .attributeRenderer=${this.attributeRenderer}
            .attributesSchema=${this.attributesSchema}
            .markdownShortcutHandler=${this.markdownShortcutHandler}
            .embedChecker=${this.embedChecker}
            .readonly=${this.model.page.readonly}
            .inlineRangeProvider=${this._inlineRangeProvider}
            .enableClipboard=${false}
            .enableUndoRedo=${false}
          ></rich-text>
        </div>
        ${collapsed ? nothing : children}
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
