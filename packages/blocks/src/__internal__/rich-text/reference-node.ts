import { FontLinkIcon } from '@blocksuite/global/config';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { PageMeta } from '@blocksuite/store';
import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { getModelByElement, NonShadowLitElement } from '../utils/index.js';
import type { AffineTextAttributes } from './virgo/types.js';

export const REFERENCE_NODE = ' ';

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
      user-select: none;
    }

    .affine-reference > span {
      white-space: pre-wrap;
    }
  `;

  @property({ type: Object })
  delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {},
  };

  @state()
  private _refMeta?: PageMeta;

  private _disposables = new DisposableGroup();

  connectedCallback() {
    super.connectedCallback();
    if (this.delta.insert !== REFERENCE_NODE) {
      console.error(
        `Reference node must be initialized with ${REFERENCE_NODE}, but got '${this.delta.insert}'`
      );
    }
    const model = getModelByElement(this);
    const reference = this.delta.attributes?.reference;
    assertExists(reference, 'Unable to get reference!');

    this._refMeta = model.page.workspace.meta.pageMetas.find(
      page => page.id === reference.pageId
    );

    this._disposables.add(
      model.page.workspace.slots.pagesUpdated.on(() => {
        this._refMeta = model.page.workspace.meta.pageMetas.find(
          page => page.id === reference.pageId
        );
      })
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  private _onClick(e: MouseEvent) {
    e.preventDefault();
    const refMeta = this._refMeta;
    const model = getModelByElement(this);
    if (!refMeta || refMeta.id === model.page.id) {
      return;
    }
    // const targetPageId = refMeta.id;
    // TODO jump to the reference
  }

  render() {
    // const style = affineTextStyles(this.textAttributes);
    const refMeta = this._refMeta;
    const title = refMeta
      ? refMeta.title
      : // Maybe the page is deleted
        'Referenced Page Not Found';
    const type = this.delta.attributes?.reference?.type;
    assertExists(type, 'Unable to get reference type!');

    // TODO fix cursor with white space
    // TODO update icon

    // This node is under contenteditable="true",
    // so we should not add any extra white space between HTML tags
    return html`<span class="affine-reference" @click=${this._onClick}
      >${FontLinkIcon}<span contenteditable="false">${title}</span>${this.delta
        .insert}</span
    >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-reference': AffineReference;
  }
}
