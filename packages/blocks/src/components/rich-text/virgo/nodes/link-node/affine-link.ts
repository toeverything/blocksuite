import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement } from '@blocksuite/lit';
import {
  type DeltaInsert,
  VIRGO_ROOT_ATTR,
  type VirgoRootElement,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getModelByElement } from '../../../../../__internal__/utils/query.js';
import type { AffineTextAttributes } from '../../types.js';
import { affineTextStyles } from '../affine-text.js';
import type { LinkPopup } from './link-popup/link-popup.js';
import { toggleLinkPopup } from './link-popup/toggle-link-popup.js';

@customElement('affine-link')
export class AffineLink extends ShadowlessElement {
  @property({ type: Object })
  delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  get link() {
    const link = this.delta.attributes?.link;
    if (!link) {
      return '';
    }
    return link;
  }

  get vEditor() {
    const vRoot = this.closest<VirgoRootElement<AffineTextAttributes>>(
      `[${VIRGO_ROOT_ATTR}]`
    );
    assertExists(vRoot);
    return vRoot.virgoEditor;
  }

  @property({ attribute: false })
  popoverHoverOpenDelay = 150;

  @state()
  private _popoverTimer = 0;

  private _isLinkHover = false;
  private _isLinkPopupHover = false;
  private _popup: LinkPopup | null = null;

  static override styles = css`
    affine-link > a {
      white-space: nowrap;
      word-break: break-word;
      color: var(--affine-link-color);
      fill: var(--affine-link-color);
      text-decoration: none;
      cursor: pointer;
    }

    affine-link > a:hover [data-virgo-text='true'] {
      text-decoration: underline;
    }

    affine-link > a > v-text {
      white-space: break-spaces;
    }
  `;

  constructor() {
    super();
    this.addEventListener('mouseenter', this._onHover);
    this.addEventListener('mouseleave', this._onHoverEnd);
  }

  private _onHover(e: MouseEvent) {
    if (this._isLinkHover) {
      return;
    } else {
      this._isLinkHover = true;
    }

    const model = getModelByElement(this);
    if (model.page.readonly) return;

    this._popoverTimer = window.setTimeout(() => {
      this._onDelayHover(e);
    }, this.popoverHoverOpenDelay);
  }

  private _onDelayHover(e: MouseEvent) {
    if (!(e.target instanceof HTMLElement) || !document.contains(e.target)) {
      return;
    }

    const selfVRange = this.vEditor.getVRangeFromElement(this);
    assertExists(selfVRange);
    const popup = toggleLinkPopup(this.vEditor, 'view', selfVRange);
    popup.addEventListener('mouseenter', () => {
      this._isLinkPopupHover = true;
    });
    popup.addEventListener('mouseleave', () => {
      this._isLinkPopupHover = false;
      popup.remove();
      this._popup = null;
    });
    this._popup = popup;
  }

  private _onHoverEnd() {
    this._isLinkHover = false;
    clearTimeout(this._popoverTimer);

    new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 1000);
    }).then(() => {
      if (!this._isLinkPopupHover) {
        if (this._popup) {
          this._popup.remove();
          this._popup = null;
        }
      }
    });
  }

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
      ? affineTextStyles(this.delta.attributes)
      : styleMap({});

    return html`<a
      href=${this.link}
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
