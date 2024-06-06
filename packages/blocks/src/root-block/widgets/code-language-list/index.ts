import './components/lang-button.js';

import { WidgetElement } from '@blocksuite/block-std';
import { offset } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { HoverController } from '../../../_common/components/index.js';
import type { CodeBlockModel } from '../../../code-block/code-model.js';
import type { CodeBlockComponent } from '../../../code-block/index.js';
import {
  PLAIN_TEXT_LANG_INFO,
  type StrictLanguageInfo,
} from '../../../code-block/utils/consts.js';

export const AFFINE_CODE_LANGUAGE_LIST_WIDGET =
  'affine-code-language-list-widget';

@customElement(AFFINE_CODE_LANGUAGE_LIST_WIDGET)
export class AffineCodeLanguageListWidget extends WidgetElement<
  CodeBlockModel,
  CodeBlockComponent
> {
  accessor _curLanguage: StrictLanguageInfo = PLAIN_TEXT_LANG_INFO;

  private _hoverController: HoverController | null = null;

  private _setupHoverController() {
    this._hoverController = null;
    this._hoverController = new HoverController(this, ({ abortController }) => {
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
          .abortController=${abortController}
        >
        </language-list-button>`,
        container: this.blockElement,
        computePosition: {
          referenceElement: this.blockElement,
          placement: 'left-start',
          middleware: [offset({ mainAxis: -5, crossAxis: 5 })],
          autoUpdate: true,
        },
      };
    });

    this._hoverController.setReference(this.blockElement);
  }

  override connectedCallback() {
    super.connectedCallback();
    this._setupHoverController();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_CODE_LANGUAGE_LIST_WIDGET]: AffineCodeLanguageListWidget;
  }
}
