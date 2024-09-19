import {
  type BlockComponent,
  type BlockStdScope,
  ShadowlessElement,
} from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import {
  type DeltaInsert,
  type InlineEditor,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/inline';
import { effect, signal } from '@preact/signals-core';
import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import katex from 'katex';
import { css, html, render, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import type { AffineTextAttributes } from '../../../../extension/index.js';

import { createLitPortal } from '../../../../../portal/helper.js';

export class AffineLatexNode extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    affine-latex-node {
      display: inline-block;
    }

    affine-latex-node .affine-latex {
      white-space: nowrap;
      word-break: break-word;
      color: ${unsafeCSS(cssVar('textPrimaryColor'))};
      fill: var(--affine-icon-color);
      border-radius: 4px;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      padding: 1px 2px 1px 0;
      display: grid;
      grid-template-columns: auto 0;
      place-items: center;
      padding: 0 4px;
      margin: 0 2px;
    }
    affine-latex-node .affine-latex:hover {
      background: ${unsafeCSS(cssVar('hoverColor'))};
    }
    affine-latex-node .affine-latex[data-selected='true'] {
      background: ${unsafeCSS(cssVar('hoverColor'))};
    }

    affine-latex-node .error-placeholder {
      display: flex;
      padding: 2px 4px;
      justify-content: center;
      align-items: flex-start;
      gap: 10px;

      border-radius: 4px;
      background: ${unsafeCSS(cssVarV2('label/red'))};

      color: ${unsafeCSS(cssVarV2('text/highlight/fg/red'))};
      font-family: Inter;
      font-size: 12px;
      font-weight: 500;
      line-height: normal;
    }

    affine-latex-node .placeholder {
      display: flex;
      padding: 2px 4px;
      justify-content: center;
      align-items: flex-start;

      border-radius: 4px;
      background: ${unsafeCSS(cssVarV2('layer/background/secondary'))};

      color: ${unsafeCSS(cssVarV2('text/secondary'))};
      font-family: Inter;
      font-size: 12px;
      font-weight: 500;
      line-height: normal;
    }
  `;

  private _editorAbortController: AbortController | null = null;

  readonly latex$ = signal('');

  get deltaLatex() {
    return this.delta.attributes?.latex as string;
  }

  get latexContainer() {
    return this.querySelector<HTMLElement>('.latex-container');
  }

  override connectedCallback() {
    const result = super.connectedCallback();

    this.latex$.value = this.deltaLatex;

    this.disposables.add(
      effect(() => {
        const latex = this.latex$.value;

        if (latex !== this.deltaLatex) {
          this.editor.formatText(
            {
              index: this.startOffset,
              length: this.endOffset - this.startOffset,
            },
            {
              latex,
            }
          );
        }

        this.updateComplete
          .then(() => {
            const latexContainer = this.latexContainer;
            if (!latexContainer) return;

            latexContainer.replaceChildren();
            // @ts-ignore
            delete latexContainer['_$litPart$'];

            if (latex.length === 0) {
              render(
                html`<span class="placeholder">Equation</span>`,
                latexContainer
              );
            } else {
              try {
                katex.render(latex, latexContainer, {
                  displayMode: true,
                  output: 'mathml',
                });
              } catch {
                latexContainer.replaceChildren();
                // @ts-ignore
                delete latexContainer['_$litPart$'];
                render(
                  html`<span class="error-placeholder">Error equation</span>`,
                  latexContainer
                );
              }
            }
          })
          .catch(console.error);
      })
    );

    this._editorAbortController?.abort();
    this._editorAbortController = new AbortController();
    this.disposables.add(() => {
      this._editorAbortController?.abort();
    });

    this.disposables.addFromEvent(this, 'click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleEditor();
    });

    return result;
  }

  override render() {
    return html`<span class="affine-latex" data-selected=${this.selected}
      ><div class="latex-container"></div>
      <v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text
    ></span>`;
  }

  toggleEditor() {
    const blockComponent = this.closest<BlockComponent>('[data-block-id]');
    if (!blockComponent) return;

    this._editorAbortController?.abort();
    this._editorAbortController = new AbortController();

    const portal = createLitPortal({
      template: html`<latex-editor-menu
        .std=${this.std}
        .latexSignal=${this.latex$}
        .abortController=${this._editorAbortController}
      ></latex-editor-menu>`,
      container: blockComponent.host,
      computePosition: {
        referenceElement: this,
        placement: 'bottom-start',
        autoUpdate: {
          animationFrame: true,
        },
      },
      closeOnClickAway: true,
      abortController: this._editorAbortController,
      shadowDom: false,
      portalStyles: {
        zIndex: 'var(--affine-z-index-popover)',
      },
    });

    this._editorAbortController.signal.addEventListener(
      'abort',
      () => {
        portal.remove();
      },
      { once: true }
    );
  }

  @property({ attribute: false })
  accessor delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ attribute: false })
  accessor editor!: InlineEditor<AffineTextAttributes>;

  @property({ attribute: false })
  accessor endOffset!: number;

  @property({ attribute: false })
  accessor selected = false;

  @property({ attribute: false })
  accessor startOffset!: number;

  @property({ attribute: false })
  accessor std!: BlockStdScope;
}
