import './components/lang-button.js';

import { WidgetElement } from '@blocksuite/block-std';
import { sleep } from '@blocksuite/global/utils';
import { offset } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { HoverController } from '../../../_common/components/index.js';
import type { CodeBlockModel } from '../../../code-block/code-model.js';
import type { CodeBlockComponent } from '../../../code-block/index.js';

export const AFFINE_CODE_LANGUAGE_LIST_WIDGET =
  'affine-code-language-list-widget';

@customElement(AFFINE_CODE_LANGUAGE_LIST_WIDGET)
export class AffineCodeLanguageListWidget extends WidgetElement<
  CodeBlockModel,
  CodeBlockComponent
> {
  private _isActivated = false;

  private _hoverController = new HoverController(
    this,
    () => {
      const codeBlock = this.blockElement;
      const selection = this.host.selection;

      const textSelection = selection.find('text');
      if (
        !!textSelection &&
        (!!textSelection.to || !!textSelection.from.length)
      ) {
        return null;
      }

      const blockSelections = selection.filter('block');
      if (
        blockSelections.length > 1 ||
        (blockSelections.length === 1 &&
          blockSelections[0].blockId !== codeBlock.blockId)
      ) {
        return null;
      }

      return {
        template: html`<language-list-button
          .blockElement=${this.blockElement}
          .onActiveStatusChange=${async (active: boolean) => {
            this._isActivated = active;
            if (!active) {
              // Wait a moment for the user to see the result.
              // This is to prevent the language list from closing immediately.
              //
              // This snippet is not perfect, it only checks the hover status at the moment.
              if (this._hoverController.isHovering) return;
              await sleep(1000);
              if (this._hoverController.isHovering || this._isActivated) return;
              this._hoverController.abort();
            }
          }}
        >
        </language-list-button>`,
        // stacking-context(editor-host)
        portalStyles: {
          zIndex: 'var(--affine-z-index-popover)',
        },
        container: this.blockElement,
        computePosition: {
          referenceElement: this.blockElement,
          placement: 'left-start',
          middleware: [offset({ mainAxis: -5, crossAxis: 5 })],
          autoUpdate: true,
        },
      };
    },
    {
      allowMultiple: true,
    }
  );

  override connectedCallback() {
    super.connectedCallback();
    this._hoverController.setReference(this.blockElement);
    this._hoverController.onAbort = () => {
      // If the language list is opened, don't close it.
      if (this._isActivated) return;
      this._hoverController.abort();
      return;
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_CODE_LANGUAGE_LIST_WIDGET]: AffineCodeLanguageListWidget;
  }
}
