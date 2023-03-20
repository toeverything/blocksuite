import type { BaseBlockModel, InlineSuggestProvider } from '@blocksuite/store';
import {
  assertExists,
  DisposableGroup,
  matchFlavours,
} from '@blocksuite/store';
import { css, html, type LitElement, type ReactiveController } from 'lit';

import { getCurrentNativeRange } from '../utils/selection.js';
import type { AffineVEditor } from './virgo/types.js';

export class InlineSuggestController implements ReactiveController {
  static styles = css`
    .inline-suggest {
      display: flex;
      align-items: center;
      gap: 4px;
      left: 0;
      top: 0;
      color: var(--affine-placeholder-color);
      fill: var(--affine-placeholder-color);
      pointer-events: none;
    }
  `;

  host: LitElement;

  private __suggestState = {
    show: false,
    position: { x: 0, y: 0 },
    loading: false,
    text: '',
  };

  private get _suggestState() {
    return this.__suggestState;
  }

  private set _suggestState(v: typeof this.__suggestState) {
    this.__suggestState = v;
    // TODO diff to optimize
    this.host.requestUpdate();
  }

  private _disposableGroup = new DisposableGroup();

  private model?: BaseBlockModel;
  private vEditor?: AffineVEditor;
  private provider?: InlineSuggestProvider;

  constructor(host: LitElement) {
    host.addController(this);
    this.host = host;
  }

  hostConnected(): void {
    this._disposableGroup = new DisposableGroup();
  }

  hostDisconnected() {
    this._disposableGroup.dispose();
  }

  init({
    model,
    vEditor,
    provider,
  }: {
    model: BaseBlockModel;
    vEditor: AffineVEditor;
    provider: InlineSuggestProvider;
  }) {
    this.provider = provider;
    this.model = model;
    this.vEditor = vEditor;
  }
  private _updatePosition() {
    const richTextRect = this.host.getBoundingClientRect();
    const range = getCurrentNativeRange();
    const rangeRect = range.getBoundingClientRect();

    return {
      x: rangeRect.x - richTextRect.x,
      y: -rangeRect.height,
    };
  }

  readonly onFocusIn = (e: FocusEvent) => {
    const inlineSuggestProvider = this.provider;
    assertExists(inlineSuggestProvider);
    assertExists(this.model);

    const editor = this.vEditor;
    assertExists(editor);
    this._disposableGroup.add(
      editor.slots.vRangeUpdated.on(async ([vRange, type]) => {
        assertExists(this.model);
        const len = editor.yText.length;
        if (!len || !vRange || vRange.length !== 0 || vRange.index !== len) {
          return;
        }
        const text = this.model.text;
        assertExists(text);
        if (this._suggestState.loading) return;
        const position = this._updatePosition();
        this._suggestState = {
          ...this._suggestState,
          position,
          loading: true,
        };

        const pageBlock = this.model.page.root;
        assertExists(pageBlock);
        if (!matchFlavours(pageBlock, ['affine:page'] as const)) {
          throw new Error('Invalid page root');
        }
        const textStr = text.toString();
        const title = pageBlock.title.toString();
        try {
          const suggest = await inlineSuggestProvider({
            title,
            text: textStr,
          });
          if (
            // User has already typed something
            textStr !== text.toString() ||
            // Focus has already moved to another block
            !this._suggestState.loading
          ) {
            this._suggestState = {
              ...this._suggestState,
              show: false,
              loading: false,
            };
            return;
          }
          // Wait for native range to be updated
          requestAnimationFrame(() => {
            const position = this._updatePosition();
            this._suggestState = {
              ...this._suggestState,
              show: true,
              text: suggest,
              loading: false,
              position,
            };
          });
        } catch (error) {
          console.error('Failed to get inline suggest', error);
          this._suggestState = {
            ...this._suggestState,
            show: false,
            loading: false,
          };
        }
      })
    );
  };

  readonly onFocusOut = (e: FocusEvent) => {
    this._suggestState = {
      ...this._suggestState,
      show: false,
      loading: false,
      text: '',
    };
    // We should not observe text change when focus out
    this._disposableGroup.dispose();
    this._disposableGroup = new DisposableGroup();
  };

  readonly onKeyDown = (e: KeyboardEvent) => {
    if (!this._suggestState.show) return;
    if (e.isComposing || e.key !== 'Tab') {
      if (e.key !== 'Tab') {
        requestAnimationFrame(() => {
          const position = this._updatePosition();
          this._suggestState = {
            ...this._suggestState,
            position,
          };
        });
      }
      return;
    }
    const editor = this.vEditor;
    assertExists(editor);
    const vRange = editor.getVRange();
    if (!vRange) return;
    const suggest = this._suggestState.text;
    editor.insertText(vRange, suggest);
    editor.setVRange({
      index: vRange.index + suggest.length,
      length: 0,
    });
    this._suggestState = { ...this._suggestState, text: '' };

    e.stopPropagation();
    e.preventDefault();
  };

  render() {
    if (!this._suggestState.show || !this._suggestState.text) return html``;
    const text = this._suggestState.loading ? '...' : this._suggestState.text;
    const position = this._suggestState.position;

    return html`<div
      class="inline-suggest"
      style="transform: translateY(${position.y}px); text-indent: ${position.x +
      2}px; margin-bottom: ${position.y}px;"
    >
      ${text}
    </div>`;
  }
}
