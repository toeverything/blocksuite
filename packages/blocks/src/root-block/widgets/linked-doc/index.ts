import type { AffineInlineEditor } from '@blocksuite/affine-components/rich-text';
import type { EditorHost, UIEventStateContext } from '@blocksuite/block-std';

import { getInlineEditorByModel } from '@blocksuite/affine-components/rich-text';
import {
  getCurrentNativeRange,
  getViewportElement,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import { DisposableGroup, throttle } from '@blocksuite/global/utils';
import { InlineEditor } from '@blocksuite/inline';

import { getPopperPosition } from '../../../root-block/utils/position.js';
import { getMenus, type LinkedMenuGroup } from './config.js';
import { LinkedDocPopover } from './linked-doc-popover.js';

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
  private _abortController: AbortController | null = null;

  private _getInlineEditor = (evt: KeyboardEvent | CompositionEvent) => {
    if (evt.target instanceof HTMLElement) {
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
    if (!text) return;

    const model = this.host.doc.getBlockById(text.blockId);
    if (!model) return;

    if (matchFlavours(model, this.config.ignoreBlockTypes)) {
      return;
    }

    return getInlineEditorByModel(this.host, model);
  };

  private _onCompositionEnd = (ctx: UIEventStateContext) => {
    const event = ctx.get('defaultState').event as CompositionEvent;

    const key = event.data;

    if (
      !key ||
      !this.config.triggerKeys.some(triggerKey => triggerKey.includes(key))
    )
      return;

    const inlineEditor = this._getInlineEditor(event);
    if (!inlineEditor) return;

    this._handleInput(inlineEditor, true);
  };

  private _onKeyDown = (ctx: UIEventStateContext) => {
    const eventState = ctx.get('keyboardState');
    const event = eventState.raw;

    const key = event.key;
    if (
      key === undefined || // in mac os, the key may be undefined
      key === 'Process' ||
      event.isComposing
    )
      return;

    const inlineEditor = this._getInlineEditor(event);
    if (!inlineEditor) return;
    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    if (inlineRange.length > 0) {
      // When select text and press `[[` should not trigger transform,
      // since it will break the bracket complete.
      // Expected `[[selected text]]` instead of `@selected text]]`
      return;
    }

    this._handleInput(inlineEditor, false);
  };

  showLinkedDocPopover = (
    inlineEditor: AffineInlineEditor,
    triggerKey: string
  ) => {
    const curRange = getCurrentNativeRange();
    if (!curRange) return;

    this._abortController?.abort();
    this._abortController = new AbortController();
    const disposables = new DisposableGroup();
    this._abortController.signal.addEventListener('abort', () =>
      disposables.dispose()
    );

    const linkedDoc = new LinkedDocPopover(
      triggerKey,
      this.config.getMenus,
      this.host,
      inlineEditor,
      this._abortController
    );

    // Mount
    document.body.append(linkedDoc);
    disposables.add(() => linkedDoc.remove());

    // Handle position
    const updatePosition = throttle(() => {
      const linkedDocElement = linkedDoc.linkedDocElement;
      if (!linkedDocElement) return;
      const position = getPopperPosition(linkedDocElement, curRange);
      linkedDoc.updatePosition(position);
    }, 10);
    disposables.addFromEvent(window, 'resize', updatePosition);
    const scrollContainer = getViewportElement(this.host);
    if (scrollContainer) {
      // Note: in edgeless mode, the scroll container is not exist!
      disposables.addFromEvent(scrollContainer, 'scroll', updatePosition, {
        passive: true,
      });
    }

    // Wait for node to be mounted
    setTimeout(updatePosition);

    disposables.addFromEvent(window, 'mousedown', (e: Event) => {
      if (e.target === linkedDoc) return;
      this._abortController?.abort();
    });

    return linkedDoc;
  };

  get config(): LinkedWidgetConfig {
    return {
      triggerKeys: ['@', '[[', '【【'],
      ignoreBlockTypes: ['affine:code'],
      convertTriggerKey: true,
      getMenus,
      ...this.std.getConfig('affine:page')?.linkedWidget,
    };
  }

  private _handleInput(inlineEditor: InlineEditor, isCompositionEnd: boolean) {
    const primaryTriggerKey = this.config.triggerKeys[0];

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
          this.showLinkedDocPopover(inlineEditor, primaryTriggerKey);
        });
        return;
      }
      this.showLinkedDocPopover(inlineEditor, matchedKey);
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('keyDown', this._onKeyDown);
    this.handleEvent('compositionEnd', this._onCompositionEnd);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_LINKED_DOC_WIDGET]: AffineLinkedDocWidget;
  }
}
