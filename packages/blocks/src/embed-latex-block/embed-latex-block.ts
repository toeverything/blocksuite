import type { EmbedLatexBlockModel } from '@blocksuite/affine-model';

import { createLitPortal } from '@blocksuite/affine-components/portal';
import { effect } from '@lit-labs/preact-signals';
import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import katex from 'katex';
import { css, html, render, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';

import { EmbedBlockComponent } from '../_common/embed-block-helper/embed-block-element.js';

@customElement('affine-embed-latex-block')
export class EmbedLatexBlockComponent extends EmbedBlockComponent<EmbedLatexBlockModel> {
  private _editorAbortController: AbortController | null = null;

  static override styles = css`
    .latex-block-root {
      display: flex;
      padding: 10px 24px;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      align-self: stretch;
      border-radius: 8px;
      overflow-x: auto;
    }
    .latex-block-root:hover {
      background: ${unsafeCSS(cssVar('hoverColor'))};
    }

    .latex-block-error-placeholder {
      color: ${unsafeCSS(cssVarV2('text/highlight/fg/red'))};
      font-family: Inter;
      font-size: 12px;
      font-weight: 500;
      line-height: normal;
    }

    .latex-block-empty-placeholder {
      color: ${unsafeCSS(cssVarV2('text/secondary'))};
      font-family: Inter;
      font-size: 12px;
      font-weight: 500;
      line-height: normal;
    }

    .latex-container {
      padding: 4px;
      border-radius: 4px;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();

    this._editorAbortController?.abort();
    this._editorAbortController = new AbortController();
    this.disposables.add(() => {
      this._editorAbortController?.abort();
    });

    this.updateComplete
      .then(() => {
        this.disposables.add(
          effect(() => {
            const latexContainer = this.latexContainer;
            if (!latexContainer) return;
            const latex = this.model.latex$.value;

            latexContainer.replaceChildren();
            // @ts-ignore
            delete latexContainer['_$litPart$'];

            if (latex.length === 0) {
              render(
                html`<span class="latex-block-empty-placeholder"
                  >Equation</span
                >`,
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
                  html`<span class="latex-block-error-placeholder"
                    >Error equation</span
                  >`,
                  latexContainer
                );
              }
            }
          })
        );

        const latexRoot = this.latexRoot;
        if (!latexRoot) return;
        this.disposables.addFromEvent(latexRoot, 'click', e => {
          e.preventDefault();
          e.stopPropagation();

          this.toggleLatexEditor();
        });
      })
      .catch(console.error);
  }

  override renderBlock() {
    return this.renderEmbed(
      () =>
        html`<div class="latex-block-root">
          <div class="latex-container"></div>
        </div>`
    );
  }

  toggleLatexEditor() {
    const latexRoot = this.latexRoot;
    const latexContainer = this.latexContainer;
    if (!latexRoot || !latexContainer) return;

    this._editorAbortController?.abort();
    this._editorAbortController = new AbortController();

    latexContainer.style.backgroundColor = cssVar('hoverColor');

    const portal = createLitPortal({
      template: html`<latex-editor-menu
        .latexSignal=${this.model.latex$}
        .abortController=${this._editorAbortController}
      ></latex-editor-menu>`,
      container: this.host,
      computePosition: {
        referenceElement: latexRoot,
        placement: 'bottom',
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
        latexContainer.style.backgroundColor = '';
      },
      { once: true }
    );
  }

  get latexContainer() {
    return this.querySelector<HTMLElement>('.latex-container');
  }

  get latexRoot() {
    return this.querySelector<HTMLElement>('.latex-block-root');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-latex-block': EmbedLatexBlockComponent;
  }
}
