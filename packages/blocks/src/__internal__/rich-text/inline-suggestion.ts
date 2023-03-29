import type {
  BaseBlockModel,
  InlineSuggestionProvider,
} from '@blocksuite/store';
import {
  assertExists,
  DisposableGroup,
  matchFlavours,
} from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';
import {
  css,
  html,
  type LitElement,
  nothing,
  type ReactiveController,
} from 'lit';

import { debounce } from '../utils/index.js';
import { getCurrentNativeRange } from '../utils/selection.js';
import type { AffineVEditor } from './virgo/types.js';

export class InlineSuggestionController implements ReactiveController {
  static styles = css`
    .inline-suggestion {
      display: flex;
      align-items: center;
      gap: 4px;
      left: 0;
      top: 0;
      color: var(--affine-placeholder-color);
      fill: var(--affine-placeholder-color);
      margin-bottom: calc(-1 * var(--affine-line-height));
      transform: translateY(calc(-1 * var(--affine-line-height)));
      pointer-events: none;
    }
  `;

  host: LitElement;

  private model?: BaseBlockModel;
  private vEditor?: AffineVEditor;
  private provider?: InlineSuggestionProvider;

  private _abortController = new AbortController();
  private _disposableGroup = new DisposableGroup();

  private _suggestionState = {
    show: false,
    position: { x: 0, y: 0 },
    loading: false,
    text: '',
  };

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
    provider: InlineSuggestionProvider;
  }) {
    this.provider = provider;
    this.model = model;
    this.vEditor = vEditor;
  }

  private _setSuggestionState(newState: Partial<typeof this._suggestionState>) {
    const previousState = this._suggestionState;
    this._suggestionState = { ...previousState, ...newState };
    // TODO diff to optimize performance
    this.host.requestUpdate();
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
    if (!inlineSuggestProvider) return;
    assertExists(this.model);

    const editor = this.vEditor;
    assertExists(editor);
    this._disposableGroup.add(
      editor.slots.vRangeUpdated.on(async ([vRange, type]) => {
        this._updateSuggestions(vRange);
      })
    );
  };

  readonly onFocusOut = (e: FocusEvent) => {
    this._abortController.abort();
    // We should not observe text change when focus out
    this._disposableGroup.dispose();
    this._disposableGroup = new DisposableGroup();
  };

  private _updateSuggestions = debounce(
    async (vRange: VRange) => {
      this._abortController.abort();
      this._abortController = new AbortController();

      assertExists(this.model);
      const editor = this.vEditor;
      assertExists(editor);
      const len = editor.yText.length;
      if (!len || vRange.length !== 0 || vRange.index !== len) {
        return;
      }

      const pageBlock = this.model.page.root;
      assertExists(pageBlock);
      if (!matchFlavours(pageBlock, ['affine:page'] as const)) {
        throw new Error('Invalid page root');
      }

      this._setSuggestionState({
        show: true,
        loading: true,
        position: this._updatePosition(),
      });
      const text = this.model.text;
      assertExists(text);
      const textStr = text.toString();
      const title = pageBlock.title.toString();
      const abortController = this._abortController;
      abortController.signal.addEventListener('abort', () => {
        this._setSuggestionState({
          show: false,
          loading: false,
        });
      });
      try {
        assertExists(this.provider);
        const suggestion = await this.provider({
          title,
          text: textStr,
          abortSignal: abortController.signal,
        });
        if (abortController.signal.aborted) {
          this._setSuggestionState({
            show: false,
            loading: false,
          });
          return;
        }

        // Wait for native range to be updated
        requestAnimationFrame(() => {
          this._setSuggestionState({
            show: true,
            loading: false,
            text: suggestion,
            position: this._updatePosition(),
          });
        });
      } catch (error) {
        console.error('Failed to get inline suggest', error);
        this._setSuggestionState({
          show: false,
          loading: false,
        });
      }
    },
    300,
    { leading: false }
  );

  readonly onKeyDown = (e: KeyboardEvent) => {
    if (!this._suggestionState.show || this._suggestionState.loading) return;
    if (e.isComposing || e.key !== 'Tab') {
      requestAnimationFrame(() => {
        const position = this._updatePosition();
        this._setSuggestionState({
          position,
        });
      });
      return;
    }
    // accept suggestion
    const editor = this.vEditor;
    assertExists(editor);
    const vRange = editor.getVRange();
    if (!vRange) return;
    const suggestion = this._suggestionState.text;
    editor.insertText(vRange, suggestion);
    editor.setVRange({
      index: vRange.index + suggestion.length,
      length: 0,
    });
    this._setSuggestionState({ text: '' });

    e.stopPropagation();
    e.preventDefault();
  };

  render() {
    if (!this._suggestionState.show) return nothing;
    const text = this._suggestionState.loading
      ? '...'
      : this._suggestionState.text;
    const position = this._suggestionState.position;
    if (!text) return nothing;
    return html`<div
      class="inline-suggestion"
      style="text-indent: ${position.x + 2}px;"
    >
      ${text}
    </div>`;
  }
}
