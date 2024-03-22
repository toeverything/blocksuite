/// <reference types="vite/client" />
import '../_common/components/rich-text/rich-text.js';
import '../_common/components/block-selection.js';

import { BlockElement, getInlineRangeProvider } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { InlineRangeProvider } from '@blocksuite/inline';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import type { RichText } from '../_common/components/rich-text/rich-text.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import type { NoteBlockComponent } from '../note-block/note-block.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import type { ListBlockModel } from './list-model.js';
import type { ListService } from './list-service.js';
import { styles } from './styles.js';
import { ListIcon } from './utils/get-list-icon.js';
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
      this.doc.captureSync();
      const checkedPropObj = { checked: !this.model.checked };
      this.doc.updateBlock(this.model, checkedPropObj);
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
    if (this.rootElement instanceof EdgelessRootBlockComponent) {
      const note = this.closest<NoteBlockComponent>('affine-note');
      return note;
    }
    return this.rootElement;
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
        while (current?.tagName == 'AFFINE-LIST') {
          current.requestUpdate();
          const next = this.std.doc.getNextSibling(current.model);
          const id = next?.id;
          current = id ? this.std.view._blockMap.get(id) : undefined;
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
    if (this.doc.readonly) {
      this._isCollapsedWhenReadOnly = !this._isCollapsedWhenReadOnly;
      return;
    }
    const newCollapsedState = !this.model.collapsed;
    this._isCollapsedWhenReadOnly = newCollapsedState;
    this.doc.captureSync();
    this.doc.updateBlock(this.model, {
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
    const { model, _onClickIcon } = this;
    const collapsed = this.doc.readonly
      ? this._isCollapsedWhenReadOnly
      : !!model.collapsed;
    const listIcon = ListIcon(model, !collapsed, _onClickIcon);

    const checked =
      this.model.type === 'todo' && this.model.checked
        ? 'affine-list--checked'
        : '';

    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.renderChildren(this.model)}
    </div>`;

    return html`
      <div class=${'affine-list-block-container'}>
        <div class=${`affine-list-rich-text-wrapper ${checked}`}>
          ${this._toggleTemplate(collapsed)} ${listIcon}
          <rich-text
            .yText=${this.model.text.yText}
            .inlineEventSource=${this.topContenteditableElement ?? nothing}
            .undoManager=${this.doc.history}
            .attributeRenderer=${this.attributeRenderer}
            .attributesSchema=${this.attributesSchema}
            .markdownShortcutHandler=${this.markdownShortcutHandler}
            .embedChecker=${this.embedChecker}
            .readonly=${this.doc.readonly}
            .inlineRangeProvider=${this._inlineRangeProvider}
            .enableClipboard=${false}
            .enableUndoRedo=${false}
          ></rich-text>
        </div>

        ${collapsed ? nothing : children}

        <affine-block-selection .block=${this}></affine-block-selection>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-list': ListBlockComponent;
  }
}
