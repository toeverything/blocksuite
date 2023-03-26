import { FontLinkIcon } from '@blocksuite/global/config';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { PageMeta } from '@blocksuite/store';
import { VText } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { getModelByElement, NonShadowLitElement } from '../utils/index.js';
import { affineTextStyles } from './virgo/affine-text.js';
import type { AffineTextAttributes } from './virgo/types.js';

export const REFERENCE_NODE = '@';

@customElement('affine-reference')
export class AffineReference extends NonShadowLitElement {
  static styles = css`
    .affine-reference {
      white-space: nowrap;
      word-break: break-word;
      color: var(--affine-link-color);
      fill: var(--affine-link-color);
      text-decoration: none;
      cursor: pointer;
    }

    .affine-reference > span {
      white-space: pre-wrap;
    }
  `;

  @property({ type: Object })
  textAttributes: AffineTextAttributes = {};

  @property({ type: Object })
  vText: VText = new VText();

  @state()
  refMeta?: PageMeta;

  _disposableGroup = new DisposableGroup();

  connectedCallback() {
    super.connectedCallback();
    if (this.vText.str !== REFERENCE_NODE) {
      console.error(
        `Reference node must be initialized with ${REFERENCE_NODE}, but got '${this.vText.str}'`
      );
    }
    const model = getModelByElement(this);
    const reference = this.textAttributes?.reference;
    assertExists(
      reference,
      'Failed to get reference! reference is not defined!'
    );

    this.refMeta = model.page.workspace.meta.pageMetas.find(
      page => page.id === reference.pageId
    );

    this._disposableGroup.add(
      model.page.workspace.slots.pagesUpdated.on(() => {
        this.refMeta = model.page.workspace.meta.pageMetas.find(
          page => page.id === reference.pageId
        );
      })
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposableGroup.dispose();
  }

  private _onClick(e: MouseEvent) {
    e.preventDefault();
    // TODO jump to the reference
  }

  render() {
    const style = affineTextStyles(this.textAttributes);
    const refMeta = this.refMeta;
    const title = refMeta
      ? refMeta.title
      : // Maybe the page is deleted
        'Reference not found';
    const type = this.textAttributes.reference?.type;
    assertExists(type, 'Failed to get reference type! type is not defined!');

    return html`<span
      class="affine-reference"
      contenteditable="false"
      style=${style}
      @click=${this._onClick}
    >
      ${FontLinkIcon}<span>${title}</span>
    </span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-reference': AffineReference;
  }
}
