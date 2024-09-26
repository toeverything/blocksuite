import type { ReferenceInfo, ReferenceParams } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';

import { ParseDocUrlProvider } from '@blocksuite/affine-shared/services';
import { BLOCK_ID_ATTR, ShadowlessElement } from '@blocksuite/block-std';
import {
  type DeltaInsert,
  INLINE_ROOT_ATTR,
  type InlineRootElement,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/inline';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { HoverController } from '../../../../../hover/index.js';
import {
  type AffineTextAttributes,
  RefNodeSlotsProvider,
} from '../../../../extension/index.js';
import { affineTextStyles } from '../affine-text.js';
import { toggleLinkPopup } from './link-popup/toggle-link-popup.js';

export class AffineLink extends ShadowlessElement {
  static override styles = css`
    affine-link a:hover [data-v-text='true'] {
      text-decoration: underline;
    }
  `;

  // The link has been identified.
  private _identified: boolean = false;

  // see https://github.com/toeverything/AFFiNE/issues/1540
  private _onMouseUp = () => {
    const anchorElement = this.querySelector('a');
    if (!anchorElement || !anchorElement.isContentEditable) return;
    anchorElement.contentEditable = 'false';
    setTimeout(() => {
      anchorElement.removeAttribute('contenteditable');
    }, 0);
  };

  private _referenceInfo: ReferenceInfo | null = null;

  private _whenHover = new HoverController(
    this,
    ({ abortController }) => {
      if (this.block?.doc.readonly) {
        return null;
      }
      if (!this.inlineEditor || !this.selfInlineRange) {
        return null;
      }

      const selection = this.std?.selection;
      const textSelection = selection?.find('text');
      if (!!textSelection && !textSelection.isCollapsed()) {
        return null;
      }

      const blockSelections = selection?.filter('block');
      if (blockSelections?.length) {
        return null;
      }

      return {
        template: toggleLinkPopup(
          this.inlineEditor,
          'view',
          this.selfInlineRange,
          abortController,
          (e?: MouseEvent) => {
            this.openLink(e);
            abortController.abort();
          }
        ),
      };
    },
    { enterDelay: 500 }
  );

  openLink = (e?: MouseEvent) => {
    if (!this._identified) {
      this._identified = true;
      this._identify();
    }

    const referenceInfo = this._referenceInfo;
    if (!referenceInfo) return;

    const refNodeSlotsProvider = this.std?.getOptional(RefNodeSlotsProvider);
    if (!refNodeSlotsProvider) return;

    e?.preventDefault();

    refNodeSlotsProvider.docLinkClicked.emit(referenceInfo);
  };

  // Workaround for links not working in contenteditable div
  // see also https://stackoverflow.com/questions/12059211/how-to-make-clickable-anchor-in-contenteditable-div
  //
  // Note: We cannot use JS to directly open a new page as this may be blocked by the browser.
  //
  // Please also note that when readonly mode active,
  // this workaround is not necessary and links work normally.
  get block() {
    const block = this.inlineEditor?.rootElement.closest<BlockComponent>(
      `[${BLOCK_ID_ATTR}]`
    );
    return block;
  }

  get inlineEditor() {
    const inlineRoot = this.closest<InlineRootElement<AffineTextAttributes>>(
      `[${INLINE_ROOT_ATTR}]`
    );
    return inlineRoot?.inlineEditor;
  }

  get link() {
    return this.delta.attributes?.link ?? '';
  }

  get selfInlineRange() {
    const selfInlineRange = this.inlineEditor?.getInlineRangeFromElement(this);
    return selfInlineRange;
  }

  get std() {
    const std = this.block?.std;
    return std;
  }

  // Identify if url is an in-app link
  private _identify() {
    const link = this.link;
    if (!link) return;

    const result = this.std
      ?.getOptional(ParseDocUrlProvider)
      ?.parseDocUrl(link);
    if (!result) return;

    const { docId: pageId, mode, blockIds, elementIds } = result;

    let params: ReferenceParams | undefined = undefined;
    if (mode || blockIds?.length || elementIds?.length) {
      params = { mode, blockIds, elementIds };
    }

    this._referenceInfo = { pageId, params };
  }

  private _renderLink(style: StyleInfo) {
    return html`<a
      ${ref(this._whenHover.setReference)}
      href=${this.link}
      rel="noopener noreferrer"
      target="_blank"
      style=${styleMap(style)}
      @click=${this.openLink}
      @mouseup=${this._onMouseUp}
      ><v-text .str=${this.delta.insert}></v-text
    ></a>`;
  }

  override render() {
    const linkStyle = {
      color: 'var(--affine-link-color)',
      fill: 'var(--affine-link-color)',
      'text-decoration': 'none',
      cursor: 'pointer',
    };

    if (this.delta.attributes && this.delta.attributes?.code) {
      const codeStyle = affineTextStyles(this.delta.attributes);
      return html`<code style=${styleMap(codeStyle)}>
        ${this._renderLink(linkStyle)}
      </code>`;
    }

    const style = this.delta.attributes
      ? affineTextStyles(this.delta.attributes, linkStyle)
      : {};

    return this._renderLink(style);
  }

  @property({ type: Object })
  accessor delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };
}
