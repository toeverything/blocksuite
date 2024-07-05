import type { BlockElement } from '@blocksuite/block-std';
import { ShadowlessElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  type DeltaInsert,
  INLINE_ROOT_ATTR,
  type InlineRootElement,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/inline';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import { HoverController } from '../../../../components/hover/index.js';
import { BLOCK_ID_ATTR } from '../../../../consts.js';
import type { AffineTextAttributes } from '../../affine-inline-specs.js';
import { affineTextStyles } from '../affine-text.js';
import { toggleLinkPopup } from './link-popup/toggle-link-popup.js';

@customElement('affine-link')
export class AffineLink extends ShadowlessElement {
  get link() {
    const link = this.delta.attributes?.link;
    if (!link) {
      return '';
    }
    return link;
  }

  get inlineEditor() {
    const inlineRoot = this.closest<InlineRootElement<AffineTextAttributes>>(
      `[${INLINE_ROOT_ATTR}]`
    );
    assertExists(inlineRoot);
    return inlineRoot.inlineEditor;
  }

  get selfInlineRange() {
    const selfInlineRange = this.inlineEditor.getInlineRangeFromElement(this);
    assertExists(selfInlineRange);
    return selfInlineRange;
  }

  get blockElement() {
    const blockElement = this.inlineEditor.rootElement.closest<BlockElement>(
      `[${BLOCK_ID_ATTR}]`
    );
    assertExists(blockElement);
    return blockElement;
  }

  get std() {
    const std = this.blockElement.std;
    assertExists(std);
    return std;
  }

  static override styles = css`
    affine-link > a:hover [data-v-text='true'] {
      text-decoration: underline;
    }
  `;

  private _whenHover = new HoverController(
    this,
    ({ abortController }) => {
      if (this.blockElement.doc.readonly) {
        return null;
      }

      const selection = this.std.selection;
      const textSelection = selection.find('text');
      if (
        !!textSelection &&
        (!!textSelection.to || !!textSelection.from.length)
      ) {
        return null;
      }

      const blockSelections = selection.filter('block');
      if (blockSelections.length) {
        return null;
      }

      return {
        template: toggleLinkPopup(
          this.inlineEditor,
          'view',
          this.selfInlineRange,
          abortController
        ),
      };
    },
    { enterDelay: 500 }
  );

  @property({ type: Object })
  accessor delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  // Workaround for links not working in contenteditable div
  // see also https://stackoverflow.com/questions/12059211/how-to-make-clickable-anchor-in-contenteditable-div
  //
  // Note: We cannot use JS to directly open a new page as this may be blocked by the browser.
  //
  // Please also note that when readonly mode active,
  // this workaround is not necessary and links work normally.
  // see https://github.com/toeverything/AFFiNE/issues/1540
  private _onMouseUp() {
    const anchorElement = this.querySelector('a');
    assertExists(anchorElement);
    if (!anchorElement.isContentEditable) return;
    anchorElement.contentEditable = 'false';
    setTimeout(() => {
      anchorElement.removeAttribute('contenteditable');
    }, 0);
  }

  override render() {
    const style = this.delta.attributes
      ? affineTextStyles(this.delta.attributes, {
          color: 'var(--affine-link-color)',
          fill: 'var(--affine-link-color)',
          'text-decoration': 'none',
          cursor: 'pointer',
        })
      : styleMap({});

    return html`<a
      ${ref(this._whenHover.setReference)}
      href=${this.link}
      affine-link
      rel="noopener noreferrer"
      target="_blank"
      style=${style}
      @mouseup=${this._onMouseUp}
      ><v-text .str=${this.delta.insert}></v-text
    ></a>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-link': AffineLink;
  }
}
