/// <reference types="vite/client" />
import type { ListBlockModel } from '@blocksuite/affine-model';
import type { BaseSelection, BlockComponent } from '@blocksuite/block-std';
import type { InlineRange, InlineRangeProvider } from '@blocksuite/inline';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import {
  playCheckAnimation,
  toggleDown,
  toggleRight,
} from '@blocksuite/affine-components/icons';
import {
  markdownInput,
  type RichText,
} from '@blocksuite/affine-components/rich-text';
import '@blocksuite/affine-components/rich-text';
import '@blocksuite/affine-shared/commands';
import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  NOTE_SELECTOR,
} from '@blocksuite/affine-shared/consts';
import { getViewportElement } from '@blocksuite/affine-shared/utils';
import { getInlineRangeProvider } from '@blocksuite/block-std';
import { IS_MAC } from '@blocksuite/global/env';
import { effect } from '@lit-labs/preact-signals';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import type { ListBlockService } from './list-service.js';

import { correctNumberedListsOrderToPrev } from './commands/utils.js';
import { listBlockStyles } from './styles.js';
import { forwardDelete } from './utils/forward-delete.js';
import { getListIcon } from './utils/get-list-icon.js';

@customElement('affine-list')
export class ListBlockComponent extends CaptionedBlockComponent<
  ListBlockModel,
  ListBlockService
> {
  static override styles = listBlockStyles;

  private _getInlineRange = (): InlineRange | null => {
    const richText = this._richTextElement;
    const inlineEditor = richText?.inlineEditor;
    const inlineRange = inlineEditor?.getInlineRange();
    return inlineRange ?? null;
  };

  private _inlineRangeProvider: InlineRangeProvider | null = null;

  private _onClickIcon = (e: MouseEvent) => {
    e.stopPropagation();

    if (this.model.type === 'toggle') {
      this._toggleChildren();
      return;
    } else if (this.model.type === 'todo') {
      if (this.doc.readonly) return;

      this.doc.captureSync();
      const checkedPropObj = { checked: !this.model.checked };
      this.doc.updateBlock(this.model, checkedPropObj);
      if (this.model.checked) {
        const checkEl = this.querySelector('.affine-list-block__todo-prefix');
        if (checkEl) {
          playCheckAnimation(checkEl).catch(console.error);
        }
      }
      return;
    }
    this._select();
  };

  private _splitList = () => {
    const inlineRange = this._getInlineRange();
    if (!inlineRange) return;
    this.std.command.exec('splitList', {
      blockId: this.model.id,
      inlineIndex: inlineRange.index,
    });
    return true;
  };

  get attributeRenderer() {
    return this.inlineManager.getRenderer();
  }

  get attributesSchema() {
    return this.inlineManager.getSchema();
  }

  get embedChecker() {
    return this.inlineManager.embedChecker;
  }

  get inlineManager() {
    return this.service?.inlineManager;
  }

  get markdownShortcutHandler() {
    return this.inlineManager.markdownShortcutHandler;
  }

  override get topContenteditableElement() {
    if (this.rootComponent?.tagName.toLowerCase() === 'affine-edgeless-root') {
      return this.closest<BlockComponent>(NOTE_SELECTOR);
    }
    return this.rootComponent;
  }

  private _select() {
    const selection = this.host.selection;
    selection.update(selList => {
      return selList
        .filter<BaseSelection>(sel => !sel.is('text') && !sel.is('block'))
        .concat(selection.create('block', { blockId: this.blockId }));
    });
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

  override connectedCallback() {
    super.connectedCallback();

    // TODO: move to service for better performance
    this.bindHotKey({
      Enter: ctx => {
        const split = this._splitList();
        if (split) {
          ctx.get('keyboardState').raw.preventDefault();
        }
        return split;
      },
      'Mod-Enter': ctx => {
        const split = this._splitList();
        if (split) {
          ctx.get('keyboardState').raw.preventDefault();
        }
        return split;
      },
      Tab: ctx => {
        const { selectedModels } = this.std.command.exec('getSelectedModels', {
          types: ['text'],
        });
        if (selectedModels?.length !== 1) {
          return;
        }
        const inlineRange = this._getInlineRange();
        if (!inlineRange) return;

        ctx.get('keyboardState').raw.preventDefault();
        this.std.command.exec('indentList', {
          blockId: this.model.id,
          inlineIndex: inlineRange.index,
        });
        return true;
      },
      'Shift-Tab': ctx => {
        const { selectedModels } = this.std.command.exec('getSelectedModels', {
          types: ['text'],
        });
        if (selectedModels?.length !== 1) {
          return;
        }
        const inlineRange = this._getInlineRange();
        if (!inlineRange) return;

        ctx.get('keyboardState').raw.preventDefault();
        this.std.command.exec('dedentList', {
          blockId: this.model.id,
          inlineIndex: inlineRange.index,
        });
        return true;
      },
      Backspace: ctx => {
        const text = this.std.selection.find('text');
        if (!text) return;
        const isCollapsed = text.isCollapsed();
        const isStart = isCollapsed && text.from.index === 0;
        if (!isStart) return;

        ctx.get('keyboardState').raw.preventDefault();
        this.std.command.exec('listToParagraph', { id: text.from.blockId });
        return true;
      },
      'Control-d': ctx => {
        if (!IS_MAC) return;
        const deleted = forwardDelete(this.std);
        if (!deleted) return;
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      Delete: ctx => {
        const deleted = forwardDelete(this.std);
        if (!deleted) return;
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      Space: ctx => {
        if (!markdownInput(this.std)) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
      'Shift-Space': ctx => {
        if (!markdownInput(this.std)) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        return true;
      },
    });

    this._inlineRangeProvider = getInlineRangeProvider(this);

    this.disposables.add(
      effect(() => {
        const type = this.model.type$.value;
        const order = this.model.order$.value;
        // old numbered list has no order
        if (type === 'numbered' && !Number.isInteger(order)) {
          correctNumberedListsOrderToPrev(this.doc, this.model, false);
        }
        // if list is not numbered, order should be null
        if (type !== 'numbered' && order !== null) {
          this.model.order = null;
        }
      })
    );
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override renderBlock(): TemplateResult<1> {
    const { model, _onClickIcon } = this;
    const collapsed = this.doc.readonly
      ? this._isCollapsedWhenReadOnly
      : !!model.collapsed;
    const listIcon = getListIcon(model, !collapsed, _onClickIcon);

    const checked =
      this.model.type === 'todo' && this.model.checked
        ? 'affine-list--checked'
        : '';

    const children = html`<div
      class="affine-block-children-container ${collapsed
        ? 'affine-list__collapsed'
        : ''}"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px;"
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

        ${children}
      </div>
    `;
  }

  @state()
  private accessor _isCollapsedWhenReadOnly = false;

  @query('rich-text')
  private accessor _richTextElement: RichText | null = null;

  override accessor blockContainerStyles = {
    margin: '10px 0',
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-list': ListBlockComponent;
  }
}
