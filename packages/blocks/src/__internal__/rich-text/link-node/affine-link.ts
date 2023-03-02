import { FontLinkIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import {
  DeltaInsert,
  TextAttributes,
  VEditor,
  VirgoUnitText,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { showLinkPopover } from '../../../components/link-popover/index.js';
import {
  getDefaultPageBlock,
  getModelByElement,
  NonShadowLitElement,
} from '../../utils/index.js';

function affineLinkStyles(props: TextAttributes): ReturnType<typeof styleMap> {
  let textDecorations = '';
  if (props.underline) {
    textDecorations += 'underline';
  }
  if (props.strike) {
    textDecorations += ' line-through';
  }

  let inlineCodeStyle = {};
  if (props.code) {
    inlineCodeStyle = {
      'font-family':
        '"SFMono-Regular", Menlo, Consolas, "PT Mono", "Liberation Mono", Courier, monospace',
      'line-height': 'normal',
      background: 'rgba(135,131,120,0.15)',
      color: '#EB5757',
      'border-radius': '3px',
      'font-size': '85%',
      padding: '0.2em 0.4em',
    };
  }

  return styleMap({
    'white-space': 'break-spaces',
    'font-weight': props.bold ? 'bold' : 'normal',
    'font-style': props.italic ? 'italic' : 'normal',
    'text-decoration': textDecorations.length > 0 ? textDecorations : 'none',
    ...inlineCodeStyle,
  });
}

@customElement('affine-link')
export class AffineLink extends NonShadowLitElement {
  @property({ type: Object })
  delta: DeltaInsert<TextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
    attributes: {
      link: '',
    },
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

  static styles = css`
    a {
      color: var(--affine-link-color);
      text-decoration: none;
      cursor: pointer;
    }

    /*
    a:visited {
      color: var(--affine-link-visited-color);
    }
    */

    a:hover [data-virgo-text='true'] {
      text-decoration: underline;
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
    const page = getDefaultPageBlock(model);
    if (page.readonly) {
      return;
    }

    this._popoverTimer = window.setTimeout(() => {
      this.onDelayHover(e);
    }, this.popoverHoverOpenDelay);
  }

  async onDelayHover(e: MouseEvent) {
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
    const { page: page } = model;
    const oldDelta = this.delta;

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
            length: oldDelta.insert.length,
          },
          { link }
        );
      }
    } else {
      page.captureSync();
      const newAttributes = { ...oldDelta.attributes };
      delete newAttributes.link;
      vEditor.formatText(
        {
          index: domPoint.index,
          length: oldDelta.insert.length,
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

  render() {
    const unitText = new VirgoUnitText();
    unitText.str = this.delta.insert;
    const style = this.delta.attributes
      ? affineLinkStyles(this.delta.attributes)
      : styleMap({});

    return html`<a
      href=${this.link}
      rel="noopener noreferrer"
      target="_blank"
      style=${style}
      data-virgo-element="true"
      >${FontLinkIcon}${unitText}</a
    >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-link': AffineLink;
  }
}
