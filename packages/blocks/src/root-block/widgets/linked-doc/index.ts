import type { AffineInlineEditor } from '@blocksuite/affine-components/rich-text';
import type { EditorHost, UIEventStateContext } from '@blocksuite/block-std';

import { getInlineEditorByModel } from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import { InlineEditor } from '@blocksuite/inline';
import { signal } from '@preact/signals-core';
import { html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import {
  getMenus,
  type LinkedDocContext,
  type LinkedMenuGroup,
} from './config.js';

export const AFFINE_LINKED_DOC_WIDGET = 'affine-linked-doc-widget';

export interface LinkedWidgetConfig {
  /**
   * The first item of the trigger keys will be the primary key
   * e.g. @, [[
   */
  triggerKeys: [string, ...string[]];
  /**
   * Convert trigger key to primary key (the first item of the trigger keys)
   * [[ -> @
   */
  convertTriggerKey: boolean;
  ignoreBlockTypes: (keyof BlockSuite.BlockModels)[];
  getMenus: (
    query: string,
    abort: () => void,
    editorHost: EditorHost,
    inlineEditor: AffineInlineEditor
  ) => Promise<LinkedMenuGroup[]>;
}

export class AffineLinkedDocWidget extends WidgetComponent {
  private readonly _getInlineEditor = (
    evt?: KeyboardEvent | CompositionEvent
  ) => {
    if (evt && evt.target instanceof HTMLElement) {
      const editor = (
        evt.target.closest('.can-link-doc > .inline-editor') as {
          inlineEditor?: AffineInlineEditor;
        }
      )?.inlineEditor;
      if (editor instanceof InlineEditor) {
        return editor;
      }
    }

    const text = this.host.selection.value.find(selection =>
      selection.is('text')
    );
    if (!text) return null;

    const model = this.host.doc.getBlockById(text.blockId);
    if (!model) return null;

    if (matchFlavours(model, this.config.ignoreBlockTypes)) {
      return null;
    }

    return getInlineEditorByModel(this.host, model);
  };

  private readonly _onCompositionEnd = (ctx: UIEventStateContext) => {
    const event = ctx.get('defaultState').event as CompositionEvent;

    const key = event.data;

    if (
      !key ||
      !this.config.triggerKeys.some(triggerKey => triggerKey.includes(key))
    )
      return;

    this._inlineEditor = this._getInlineEditor(event);
    if (!this._inlineEditor) return;

    this._handleInput(true);
  };

  private readonly _onKeyDown = (ctx: UIEventStateContext) => {
    const eventState = ctx.get('keyboardState');
    const event = eventState.raw;

    const key = event.key;
    if (
      key === undefined || // in mac os, the key may be undefined
      key === 'Process' ||
      event.isComposing
    )
      return;

    this._inlineEditor = this._getInlineEditor(event);
    if (!this._inlineEditor) return;

    const inlineRange = this._inlineEditor.getInlineRange();
    if (!inlineRange) return;

    if (inlineRange.length > 0) {
      // When select text and press `[[` should not trigger transform,
      // since it will break the bracket complete.
      // Expected `[[selected text]]` instead of `@selected text]]`
      return;
    }

    this._handleInput(false);
  };

  private readonly _renderDesktopLinkedDocPopover = () => {
    return html`<affine-linked-doc-popover
      .context=${this._context}
    ></affine-linked-doc-popover>`;
  };

  private readonly _show = signal<'desktop' | 'none'>('none');

  closeLinkedDocPopover = () => {
    this._inlineEditor = null;
    this._triggerKey = '';
    this._show.value = 'none';
  };

  showLinkedDocPopover = () => {
    if (this._inlineEditor === null) {
      this._inlineEditor = this._getInlineEditor();
    }
    if (this._triggerKey === '') {
      this._triggerKey = this.config.triggerKeys[0];
    }
    this._show.value = 'desktop';
    return;
  };

  private get _context(): LinkedDocContext {
    return {
      std: this.std,
      inlineEditor: this._inlineEditor!,
      triggerKey: this._triggerKey,
      getMenus: this.config.getMenus,
      close: this.closeLinkedDocPopover,
    };
  }

  get config(): LinkedWidgetConfig {
    return {
      triggerKeys: ['@', '[[', '【【'],
      ignoreBlockTypes: ['affine:code'],
      convertTriggerKey: true,
      getMenus,
      ...this.std.getConfig('affine:page')?.linkedWidget,
    };
  }

  private _handleInput(isCompositionEnd: boolean) {
    const primaryTriggerKey = this.config.triggerKeys[0];

    const inlineEditor = this._inlineEditor;
    if (!inlineEditor) return;

    const inlineRangeApplyCallback = (callback: () => void) => {
      // the inline ranged updated in compositionEnd event before this event callback
      if (isCompositionEnd) callback();
      else inlineEditor.slots.inlineRangeSync.once(callback);
    };

    inlineRangeApplyCallback(() => {
      const inlineRange = inlineEditor.getInlineRange();
      if (!inlineRange) return;
      const textPoint = inlineEditor.getTextPoint(inlineRange.index);
      if (!textPoint) return;
      const [leafStart, offsetStart] = textPoint;

      const text = leafStart.textContent
        ? leafStart.textContent.slice(0, offsetStart)
        : '';

      const matchedKey = this.config.triggerKeys.find(triggerKey =>
        text.endsWith(triggerKey)
      );
      if (!matchedKey) return;

      if (this.config.convertTriggerKey && primaryTriggerKey !== matchedKey) {
        const inlineRange = inlineEditor.getInlineRange();
        if (!inlineRange) return;

        // Convert to the primary trigger key
        // e.g. [[ -> @
        this._triggerKey = primaryTriggerKey;
        const startIdxBeforeMatchKey = inlineRange.index - matchedKey.length;
        inlineEditor.deleteText({
          index: startIdxBeforeMatchKey,
          length: matchedKey.length,
        });
        inlineEditor.insertText(
          { index: startIdxBeforeMatchKey, length: 0 },
          primaryTriggerKey
        );
        inlineEditor.setInlineRange({
          index: startIdxBeforeMatchKey + primaryTriggerKey.length,
          length: 0,
        });
        inlineEditor.slots.inlineRangeSync.once(() => {
          this.showLinkedDocPopover();
        });
        return;
      } else {
        this._triggerKey = matchedKey;
        this.showLinkedDocPopover();
      }
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('keyDown', this._onKeyDown);
    this.handleEvent('compositionEnd', this._onCompositionEnd);
  }

  override render() {
    if (this._show.value === 'none') return nothing;

    return html`<blocksuite-portal
      .shadowDom=${false}
      .template=${choose(
        this._show.value,
        [['desktop', this._renderDesktopLinkedDocPopover]],
        () => html`${nothing}`
      )}
    ></blocksuite-portal>`;
  }

  @state()
  private accessor _inlineEditor: AffineInlineEditor | null = null;

  @state()
  private accessor _triggerKey = '';
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_LINKED_DOC_WIDGET]: AffineLinkedDocWidget;
  }
}
