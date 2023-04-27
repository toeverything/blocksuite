import { FontLinkIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { type DeltaInsert, VEditor, ZERO_WIDTH_SPACE } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { showLinkPopover } from '../../../components/link-popover/index.js';
import { getModelByElement, ShadowlessElement } from '../../utils/index.js';
import { affineTextStyles } from '../virgo/affine-text.js';
import type { AffineTextAttributes } from '../virgo/types.js';

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

  @property()
  popoverHoverOpenDelay = 150;

  @state()
  private _popoverTimer = 0;

  private _isHovering = false;

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
    this.addEventListener('mouseenter', this.onHover);
    this.addEventListener('mouseleave', this._onHoverEnd);
  }

  onHover(e: MouseEvent) {
    if (this._isHovering) {
      return;
    } else {
      this._isHovering = true;
    }

    const model = getModelByElement(this);
    if (model.page.readonly) return;

    this._popoverTimer = window.setTimeout(() => {
      this.onDelayHover(e);
    }, this.popoverHoverOpenDelay);
  }

  async onDelayHover(e: MouseEvent) {
    if (!(e.target instanceof HTMLElement) || !document.contains(e.target)) {
      return;
    }

    const text = this.delta.insert;
    const linkState = await showLinkPopover({
      anchorEl: e.target as HTMLElement,
      text,
      link: this.link,
      showMask: false,
      interactionKind: 'hover',
    });
    if (linkState.type === 'confirm') {
      const link = linkState.link;
      const newText = linkState.text;
      const isUpdateText = newText !== text;
      this._updateLink(link, isUpdateText ? newText : undefined);
      return;
    }
    if (linkState.type === 'remove') {
      this._updateLink();
      return;
    }
  }

  /**
   * If no pass text, use the original text
   */
  private _updateLink(link?: string, text?: string) {
    const model = getModelByElement(this);
    const { page } = model;
    const oldStr = this.delta.insert;
    const oldTextAttributes = this.delta.attributes;

    const textElement = this.querySelector('[data-virgo-text="true"]');
    assertExists(textElement);
    const textNode = Array.from(textElement.childNodes).find(
      (node): node is Text => node instanceof Text
    );
    assertExists(textNode);
    const richText = this.closest('rich-text');
    assertExists(richText);
    const domPoint = VEditor.textPointToDomPoint(
      textNode,
      0,
      richText.virgoContainer
    );
    assertExists(domPoint);
    const vEditor = richText.vEditor;
    assertExists(vEditor);

    if (link) {
      if (text) {
        page.captureSync();
        vEditor.deleteText({
          index: domPoint.index,
          length: textNode.length,
        });
        vEditor.insertText({ index: domPoint.index, length: 0 }, text);
        vEditor.formatText(
          {
            index: domPoint.index,
            length: text.length,
          },
          { link }
        );
      } else {
        page.captureSync();
        vEditor.formatText(
          {
            index: domPoint.index,
            length: oldStr.length,
          },
          { link }
        );
      }
    } else {
      page.captureSync();
      const newAttributes = { ...oldTextAttributes };
      delete newAttributes.link;
      vEditor.formatText(
        {
          index: domPoint.index,
          length: oldStr.length,
        },
        newAttributes,
        {
          mode: 'replace',
        }
      );
    }
  }

  private _onHoverEnd(e: Event) {
    this._isHovering = false;
    clearTimeout(this._popoverTimer);
  }

  // Workaround for links not working in contenteditable div
  // see also https://stackoverflow.com/questions/12059211/how-to-make-clickable-anchor-in-contenteditable-div
  //
  // Note: We cannot use JS to directly open a new page as this may be blocked by the browser.
  //
  // Please also note that when readonly mode active,
  // this workaround is not necessary and links work normally.
  // see https://github.com/toeverything/AFFiNE/issues/1540
  private _onMouseUp(e: MouseEvent) {
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
      >${FontLinkIcon}<v-text .str=${this.delta.insert}></v-text
    ></a>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-link': AffineLink;
  }
}
