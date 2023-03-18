import {
  type BaseBlockModel,
  DisposableGroup,
  matchFlavours,
} from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import type { Highlighter, Lang } from 'shiki';
import { z } from 'zod';

import { getCodeLineRenderer } from '../../code-block/utils/code-line-renderer.js';
import { type BlockHost, getCurrentNativeRange } from '../utils/index.js';
import { NonShadowLitElement } from '../utils/lit.js';
import { createKeyboardBindings, createKeyDownHandler } from './keyboard.js';
import { attributesRenderer } from './virgo/attributes-renderer.js';
import { affineTextAttributes, type AffineVEditor } from './virgo/types.js';

@customElement('rich-text')
export class RichText extends NonShadowLitElement {
  static styles = css`
    rich-text {
      position: relative;
    }

    .affine-rich-text {
      height: 100%;
      width: 100%;
      outline: none;
      cursor: text;
    }

    v-line {
      scroll-margin-top: 50px;
      scroll-margin-bottom: 30px;
    }

    .inline-suggest {
      display: flex;
      align-items: center;
      gap: 4px;
      left: 0;
      top: 0;
      color: var(--affine-placeholder-color);
      fill: var(--affine-placeholder-color);
      cursor: pointer;
    }
  `;

  @query('.affine-rich-text')
  private _virgoContainer!: HTMLDivElement;
  get virgoContainer() {
    return this._virgoContainer;
  }

  @property()
  host!: BlockHost;

  @property()
  model!: BaseBlockModel;

  @property()
  codeBlockGetHighlighterOptions?: () => {
    lang: Lang;
    highlighter: Highlighter | null;
  };

  private _vEditor: AffineVEditor | null = null;
  get vEditor() {
    return this._vEditor;
  }

  firstUpdated() {
    assertExists(this.model.text, 'rich-text need text to init.');
    this._vEditor = new VEditor(this.model.text.yText);
    if (this.codeBlockGetHighlighterOptions) {
      this._vEditor.setAttributesSchema(z.object({}));
      this._vEditor.setAttributesRenderer(
        getCodeLineRenderer(this.codeBlockGetHighlighterOptions)
      );
    } else {
      this._vEditor.setAttributesRenderer(attributesRenderer);
      this._vEditor.setAttributesSchema(affineTextAttributes);
    }

    const keyboardBindings = createKeyboardBindings(this.model, this._vEditor);
    const keyDownHandler = createKeyDownHandler(
      this._vEditor,
      keyboardBindings
    );

    this._vEditor.mount(this._virgoContainer);
    this._vEditor.bindHandlers({
      keydown: e => {
        keyDownHandler(e);
        requestAnimationFrame(() => {
          const richTextRect = this.getBoundingClientRect();
          const range = getCurrentNativeRange();
          const rangeRect = range.getBoundingClientRect();
          this._suggestState = {
            ...this._suggestState,
            position: {
              x: rangeRect.x - richTextRect.x,
              y: -rangeRect.height,
            },
          };
        });
      },
      virgoInput: e => {
        const vEditor = this._vEditor;
        assertExists(vEditor);
        const vRange = vEditor.getVRange();
        if (!vRange || vRange.length !== 0) {
          return false;
        }

        const deltas = vEditor.getDeltasByVRange(vRange);
        if (
          deltas.length === 1 &&
          vRange.index !== 0 &&
          vRange.index !== vEditor.yText.length &&
          e.data &&
          e.data !== '\n'
        ) {
          const attributes = deltas[0][0].attributes;
          vEditor.insertText(vRange, e.data, attributes);
          vEditor.setVRange({
            index: vRange.index + 1,
            length: 0,
          });
          return true;
        }

        return false;
      },
      virgoCompositionEnd: e => {
        const { data } = e;
        const vEditor = this._vEditor;
        assertExists(vEditor);
        const vRange = vEditor.getVRange();
        if (!vRange || vRange.length !== 0) {
          return false;
        }

        const index = vRange.index;
        const deltas = vEditor.getDeltasByVRange(vRange);
        if (
          index >= 0 &&
          data &&
          data !== '\n' &&
          deltas.length === 1 &&
          vRange.index !== 0 &&
          vRange.index !== vEditor.yText.length
        ) {
          const attributes = deltas[0][0].attributes;
          vEditor.insertText(vRange, data, attributes);
          vEditor.setVRange({
            index: index + data.length,
            length: 0,
          });
          return true;
        }
        return false;
      },
    });

    this._vEditor.setReadonly(this.model.page.readonly);
  }

  updated() {
    if (this._vEditor) {
      this._vEditor.setReadonly(this.model.page.readonly);
    }
  }

  // TODO optimize hasChanged
  @state()
  private _suggestState = {
    show: false,
    position: { x: 0, y: 0 },
    loading: false,
    text: '',
  };
  private _disposableGroup = new DisposableGroup();
  private _onFocusIn = (e: FocusEvent) => {
    const inlineSuggestProvider =
      this.model.page.workspace.inlineSuggestProvider;
    if (!inlineSuggestProvider) {
      return;
    }

    const editor = this._vEditor;
    assertExists(editor);
    this._disposableGroup.add(
      editor.slots.vRangeUpdated.on(async ([vRange, type]) => {
        const len = editor.yText.length;
        if (!len || !vRange || vRange.length !== 0 || vRange.index !== len) {
          return;
        }
        const text = this.model.text;
        assertExists(text);

        const richTextRect = this.getBoundingClientRect();
        const range = getCurrentNativeRange();
        const rangeRect = range.getBoundingClientRect();
        if (this._suggestState.loading) return;
        this._suggestState = {
          ...this._suggestState,
          show: true,
          loading: true,
          position: {
            x: rangeRect.x - richTextRect.x,
            y: rangeRect.y - richTextRect.y,
          },
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
          const richTextRect = this.getBoundingClientRect();
          const range = getCurrentNativeRange();
          const rangeRect = range.getBoundingClientRect();
          this._suggestState = {
            ...this._suggestState,
            show: true,
            text: suggest,
            loading: false,
            position: {
              x: rangeRect.x - richTextRect.x,
              y: -rangeRect.height,
            },
          };
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

  private _onFocusOut = (e: FocusEvent) => {
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

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing || !this._suggestState.show) return;
    if (e.key !== 'Tab') return;
    const editor = this._vEditor;
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
    return html`<div
        class="affine-rich-text virgo-editor"
        @keydown=${this._onKeyDown}
        @focusin=${this._onFocusIn}
        @focusout=${this._onFocusOut}
      ></div>
      ${this._suggestState.show
        ? inlineSuggest(
            this._suggestState.loading ? '...' : this._suggestState.text,
            this._suggestState.position
          )
        : ''}`;
  }
}

function inlineSuggest(str: string, position: { x: number; y: number }) {
  if (!str) return '';
  return html`<div
    class="inline-suggest"
    style="transform: translateY(${position.y}px); text-indent: ${position.x +
    2}px; margin-bottom: ${position.y}px;"
  >
    ${str}
  </div>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
