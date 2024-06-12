/// <reference types="vite/client" />
import '../_common/components/rich-text/rich-text.js';

import type { BlockElement } from '@blocksuite/block-std';
import { getInlineRangeProvider } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { InlineRangeProvider } from '@blocksuite/inline';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { BlockComponent } from '../_common/components/block-component.js';
import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import type { RichText } from '../_common/components/rich-text/rich-text.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import { getViewportElement } from '../_common/utils/query.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import type { ListBlockModel } from './list-model.js';
import type { ListBlockService } from './list-service.js';
import { listBlockStyles } from './styles.js';
import { ListIcon } from './utils/get-list-icon.js';
import { playCheckAnimation, toggleDown, toggleRight } from './utils/icons.js';

@customElement('affine-list')
export class ListBlockComponent extends BlockComponent<
  ListBlockModel,
  ListBlockService
> {
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

  override get topContenteditableElement() {
    if (this.rootElement instanceof EdgelessRootBlockComponent) {
      const el = this.closest<BlockElement>(
        'affine-note, affine-edgeless-text'
      );
      return el;
    }
    return this.rootElement;
  }

  static override styles = listBlockStyles;

  @state()
  private accessor _isCollapsedWhenReadOnly = !!this.model?.collapsed;

  @query('rich-text')
  private accessor _richTextElement: RichText | null = null;

  private _inlineRangeProvider: InlineRangeProvider | null = null;

  override accessor blockContainerStyles = {
    margin: '10px 0',
  };

  private _select() {
    const selection = this.host.selection;
    selection.update(selList => {
      return selList
        .filter(sel => !sel.is('text') && !sel.is('block'))
        .concat(selection.create('block', { blockId: this.blockId }));
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

  private _updateFollowingListSiblings() {
    this.updateComplete
      .then(() => {
        let current: BlockElement | null = this as BlockElement;
        while (current?.tagName == 'AFFINE-LIST') {
          current.requestUpdate();
          const next = this.std.doc.getNext(current.model);
          const id = next?.id;
          current = id ? this.std.view.getBlock(id) : null;
        }
      })
      .catch(console.error);
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

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override connectedCallback() {
    super.connectedCallback();

    bindContainerHotkey(this);

    this._inlineRangeProvider = getInlineRangeProvider(this);

    this._updateFollowingListSiblings();
    this.disposables.add(
      this.model.childrenUpdated.on(() => {
        this._updateFollowingListSiblings();
      })
    );
    this.disposables.add(
      this.host.std.doc.slots.blockUpdated.on(e => {
        if (e.type !== 'delete') return;
        const deletedBlock = this.std.view.getBlock(e.id);
        if (!deletedBlock) return;
        if (this !== deletedBlock.nextElementSibling) return;
        this._updateFollowingListSiblings();
        return;
      })
    );
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
            .verticalScrollContainerGetter=${() =>
              getViewportElement(this.host)}
          ></rich-text>
        </div>

        ${collapsed ? nothing : children}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-list': ListBlockComponent;
  }
}
