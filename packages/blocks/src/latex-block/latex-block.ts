import type { LatexBlockModel } from '@blocksuite/affine-model';
import type { Placement } from '@floating-ui/dom';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { createLitPortal } from '@blocksuite/affine-components/portal';
import { effect } from '@lit-labs/preact-signals';
import katex from 'katex';
import { html, render } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import type { LatexBlockService } from './latex-service.js';

import { latexBlockStyles } from './styles.js';

@customElement('affine-latex')
export class LatexBlockComponent extends CaptionedBlockComponent<
  LatexBlockModel,
  LatexBlockService
> {
  static override styles = latexBlockStyles;

  private _editorAbortController: AbortController | null = null;

  get editorPlacement(): Placement {
    return 'bottom';
  }

  get isBlockSelected() {
    const blockSelection = this.selection.filter('block');
    return blockSelection.some(
      selection => selection.blockId === this.model.id
    );
  }

  override firstUpdated(props: Map<string, unknown>) {
    super.firstUpdated(props);

    const { disposables } = this;

    this._editorAbortController?.abort();
    this._editorAbortController = new AbortController();
    disposables.add(() => {
      this._editorAbortController?.abort();
    });

    const katexContainer = this._katexContainer;
    if (!katexContainer) return;

    disposables.add(
      effect(() => {
        const latex = this.model.latex$.value;

        katexContainer.replaceChildren();
        // @ts-ignore
        delete katexContainer['_$litPart$'];

        if (latex.length === 0) {
          render(
            html`<span class="latex-block-empty-placeholder">Equation</span>`,
            katexContainer
          );
        } else {
          try {
            katex.render(latex, katexContainer, {
              displayMode: true,
              output: 'mathml',
            });
          } catch {
            katexContainer.replaceChildren();
            // @ts-ignore
            delete katexContainer['_$litPart$'];
            render(
              html`<span class="latex-block-error-placeholder"
                >Error equation</span
              >`,
              katexContainer
            );
          }
        }
      })
    );

    this.disposables.addFromEvent(this, 'click', () => {
      if (this.isBlockSelected) {
        this.toggleEditor();
      } else {
        this.selectBlock();
      }
    });
  }

  removeEditor(portal: HTMLDivElement) {
    portal.remove();
  }

  override renderBlock() {
    return html`
      <div contenteditable="false" class="latex-block-container">
        <div class="katex"></div>
      </div>
    `;
  }

  selectBlock() {
    this.host.command.exec('selectBlock', {
      focusBlock: this,
    });
  }

  toggleEditor() {
    const katexContainer = this._katexContainer;
    if (!katexContainer) return;

    this._editorAbortController?.abort();
    this._editorAbortController = new AbortController();

    this.selection.setGroup('note', [
      this.selection.create('block', {
        blockId: this.model.id,
      }),
    ]);

    const portal = createLitPortal({
      template: html`<latex-editor-menu
        .latexSignal=${this.model.latex$}
        .abortController=${this._editorAbortController}
      ></latex-editor-menu>`,
      container: this.host,
      computePosition: {
        referenceElement: this,
        placement: this.editorPlacement,
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
        this.removeEditor(portal);
      },
      { once: true }
    );
  }

  @query('.latex-block-container')
  private accessor _katexContainer!: HTMLDivElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-latex': LatexBlockComponent;
  }
}
