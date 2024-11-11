import type { AffineInlineEditor } from '@blocksuite/affine-components/rich-text';
import type { RootBlockModel } from '@blocksuite/affine-model';
import type { SelectionRect } from '@blocksuite/affine-shared/commands';
import type { UIEventStateContext } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';

import { getInlineEditorByModel } from '@blocksuite/affine-components/rich-text';
import {
  getViewportElement,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import { IS_MOBILE } from '@blocksuite/global/env';
import { InlineEditor, type InlineRange } from '@blocksuite/inline';
import { signal } from '@preact/signals-core';
import { html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { PageRootBlockComponent } from '../../index.js';

import {
  getMenus,
  type LinkedDocContext,
  type LinkedWidgetConfig,
} from './config.js';
import { linkedDocWidgetStyles } from './styles.js';
export { type LinkedWidgetConfig } from './config.js';

export const AFFINE_LINKED_DOC_WIDGET = 'affine-linked-doc-widget';

export class AffineLinkedDocWidget extends WidgetComponent<
  RootBlockModel,
  PageRootBlockComponent
> {
  static override styles = linkedDocWidgetStyles;

  private _disposeObserveInputRects: Disposable | null = null;

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

  private _inlineEditor: AffineInlineEditor | null = null;

  private _observeInputRects = () => {
    if (!this._inlineEditor) return;

    const updateInputRects = () => {
      const blockId =
        this.std.command.exec('getSelectedModels').selectedModels?.[0]?.id;
      if (!blockId) return;

      if (!this._startRange) return;
      const index = this._startRange.index - this._triggerKey.length;
      if (index < 0) return;

      const currentRange = this._inlineEditor?.getInlineRange();
      if (!currentRange) return;
      const length = currentRange.index + currentRange.length - index;

      const textSelection = this.std.selection.create('text', {
        from: { blockId, index, length },
        to: null,
      });

      const { selectionRects } = this.std.command.exec('getSelectionRects', {
        textSelection,
      });

      if (!selectionRects) return;

      this._inputRects = selectionRects;
    };

    updateInputRects();
    this._disposeObserveInputRects =
      this._inlineEditor.slots.renderComplete.on(updateInputRects);
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

    if (!this.config.triggerKeys.some(triggerKey => triggerKey.includes(key)))
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

  private readonly _renderLinkedDocMenu = () => {
    if (!this.block.rootComponent) return nothing;

    return html`<affine-mobile-linked-doc-menu
      .context=${this._context}
      .rootComponent=${this.block.rootComponent}
    ></affine-mobile-linked-doc-menu>`;
  };

  private readonly _renderLinkedDocPopover = () => {
    return html`<affine-linked-doc-popover
      .context=${this._context}
    ></affine-linked-doc-popover>`;
  };

  private readonly _show$ = signal<'desktop' | 'mobile' | 'none'>('none');

  private _startRange: InlineRange | null = null;

  close = () => {
    this._disposeObserveInputRects?.dispose();
    this._disposeObserveInputRects = null;
    this._inlineEditor = null;
    this._triggerKey = '';
    this._show$.value = 'none';
    this._startRange = null;
  };

  show = (mode: 'desktop' | 'mobile' = 'desktop') => {
    if (this._inlineEditor === null) {
      this._inlineEditor = this._getInlineEditor();
    }
    if (this._triggerKey === '') {
      this._triggerKey = this.config.triggerKeys[0];
    }

    this._startRange = this._inlineEditor?.getInlineRange() ?? null;

    const enableMobile = this.doc.awarenessStore.getFlag(
      'enable_mobile_linked_doc_menu'
    );

    this._observeInputRects();

    this._show$.value = enableMobile ? mode : 'desktop';
  };

  private get _context(): LinkedDocContext {
    return {
      std: this.std,
      inlineEditor: this._inlineEditor!,
      startRange: this._startRange!,
      triggerKey: this._triggerKey,
      config: this.config,
      close: this.close,
    };
  }

  get config(): LinkedWidgetConfig {
    return {
      triggerKeys: ['@', '[[', '【【'],
      ignoreBlockTypes: ['affine:code'],
      convertTriggerKey: true,
      getMenus,
      mobile: {
        useScreenHeight: false,
        scrollContainer: getViewportElement(this.std.host) ?? window,
        scrollTopOffset: 46,
      },
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
          this.show(IS_MOBILE ? 'mobile' : 'desktop');
        });
        return;
      } else {
        this._triggerKey = matchedKey;
        this.show(IS_MOBILE ? 'mobile' : 'desktop');
      }
    });
  }

  private _renderInputMask() {
    return html`${repeat(
      this._inputRects,
      ({ top, left, width, height }, index) => {
        const last = index === this._inputRects.length - 1;
        const padding = 2;
        return html`<div
          class="input-mask"
          style=${styleMap({
            top: `${top - padding}px`,
            left: `${left}px`,
            width: `${width + (last ? 10 : 0)}px`,
            height: `${height + 2 * padding}px`,
          })}
        ></div>`;
      }
    )}`;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('keyDown', this._onKeyDown);
    this.handleEvent('compositionEnd', this._onCompositionEnd);
  }

  override render() {
    if (this._show$.value === 'none') return nothing;

    return html`${this._renderInputMask()}
      <blocksuite-portal
        .shadowDom=${false}
        .template=${choose(
          this._show$.value,
          [
            ['desktop', this._renderLinkedDocPopover],
            ['mobile', this._renderLinkedDocMenu],
          ],
          () => html`${nothing}`
        )}
      ></blocksuite-portal>`;
  }

  @state()
  private accessor _inputRects: SelectionRect[] = [];

  @state()
  private accessor _triggerKey = '';
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_LINKED_DOC_WIDGET]: AffineLinkedDocWidget;
  }
}
