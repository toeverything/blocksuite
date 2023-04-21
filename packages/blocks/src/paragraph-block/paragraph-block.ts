import '../__internal__/rich-text/rich-text.js';

import { BlockHubIcon20 } from '@blocksuite/global/config';
import { DisposableGroup, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  type BlockHost,
  isPageMode,
  ShadowlessElement,
} from '../__internal__/index.js';
import { attributeRenderer } from '../__internal__/rich-text/virgo/attribute-renderer.js';
import {
  affineTextAttributes,
  type AffineTextSchema,
} from '../__internal__/rich-text/virgo/types.js';
import { BlockChildrenContainer } from '../__internal__/service/components.js';
import type { ParagraphBlockModel } from './paragraph-model.js';

function TipsPlaceholder(model: BaseBlockModel) {
  if (!matchFlavours(model, ['affine:paragraph'] as const)) {
    throw new Error("TipsPlaceholder can't be used for this model");
  }
  if (model.type === 'text') {
    if (!isPageMode(model.page)) {
      return html`<div class="tips-placeholder">Type '/' for commands</div> `;
    }

    const blockHub = document.querySelector('affine-block-hub');
    if (!blockHub) {
      // Fall back
      return html`<div class="tips-placeholder">Type '/' for commands</div> `;
    }
    const onClick = () => {
      if (!blockHub) {
        throw new Error('Failed to find blockHub!');
      }
      blockHub.toggleMenu(true);
    };
    return html`
      <div class="tips-placeholder" @click=${onClick}>
        Click ${BlockHubIcon20} to insert blocks, type '/' for commands
      </div>
    `;
  }

  const placeholders: Record<Exclude<ParagraphType, 'text'>, string> = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    h6: 'Heading 6',
    quote: '',
  };
  return html`<div class="tips-placeholder">${placeholders[model.type]}</div> `;
}

@customElement('affine-paragraph')
export class ParagraphBlockComponent extends ShadowlessElement {
  static override styles = css`
    .affine-edgeless-block-child
      .affine-block-element:first-child
      .affine-paragraph-block-container.text {
      margin-top: 0px;
    }

    .affine-paragraph-block-container {
      position: relative;
      border-radius: 5px;
    }
    .affine-paragraph-block-container.selected {
      background-color: var(--affine-hover-color);
    }
    .h1 {
      font-size: var(--affine-font-h1);
      line-height: calc(1em + 12px);
      margin-top: calc(var(--affine-paragraph-space) + 24px);
    }
    .h1 code {
      font-size: calc(var(--affine-font-base) + 8px);
    }
    .h2 {
      font-size: var(--affine-font-h2);
      line-height: calc(1em + 10px);
      margin-top: calc(var(--affine-paragraph-space) + 20px);
    }
    .h2 code {
      font-size: calc(var(--affine-font-base) + 6px);
    }
    .h3 {
      font-size: var(--affine-font-h3);
      line-height: calc(1em + 8px);
      margin-top: calc(var(--affine-paragraph-space) + 16px);
    }
    .h3 code {
      font-size: calc(var(--affine-font-base) + 4px);
    }
    .h4 {
      font-size: var(--affine-font-h4);
      line-height: calc(1em + 10px);
      margin-top: calc(var(--affine-paragraph-space) + 12px);
    }
    .h4 code {
      font-size: calc(var(--affine-font-base) + 2px);
    }
    .h5 {
      font-size: var(--affine-font-h5);
      line-height: calc(1em + 8px);
      margin-top: calc(var(--affine-paragraph-space) + 8px);
    }
    .h5 code {
      font-size: calc(var(--affine-font-base));
    }
    .h6 {
      font-size: var(--affine-font-h6);
      line-height: calc(1em + 8px);
      margin-top: calc(var(--affine-paragraph-space) + 4px);
    }
    .h6 code {
      font-size: calc(var(--affine-font-base) - 2px);
    }
    .quote {
      line-height: 26px;
      padding-left: 12px;
      margin-top: var(--affine-paragraph-space);
      position: relative;
    }
    .quote::after {
      content: '';
      width: 4px;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      background: var(--affine-quote-color);
      border-radius: 4px;
    }
    .text {
      margin-top: var(--affine-paragraph-space);
      font-size: var(--affine-font-base);
    }

    .tips-placeholder {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 4px;
      left: 2px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--affine-placeholder-color);
      fill: var(--affine-placeholder-color);
    }

    .tips-placeholder > svg {
      cursor: pointer;
      pointer-events: all;
    }
    .tips-placeholder > svg:hover {
      fill: var(--affine-primary-color);
    }
  `;

  @property()
  model!: ParagraphBlockModel;

  @property()
  host!: BlockHost;

  @state()
  private _tipsPlaceholderTemplate = html``;
  @state()
  private _isComposing = false;
  @state()
  private _isFocus = false;

  readonly textSchema: AffineTextSchema = {
    attributesSchema: affineTextAttributes,
    textRenderer: attributeRenderer,
  };

  private _placeholderDisposables = new DisposableGroup();

  override connectedCallback() {
    super.connectedCallback();
    // Initial placeholder state
    this._updatePlaceholder();
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => {
      this._updatePlaceholder();
      this.requestUpdate();
    });
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  private _updatePlaceholder = () => {
    if (this.model.text.length !== 0 || this._isComposing) {
      this._tipsPlaceholderTemplate = html``;
      return;
    }
    if (this.model.type === 'text' && !this._isFocus) {
      // Text block placeholder only show when focus and empty
      this._tipsPlaceholderTemplate = html``;
      return;
    }
    this._tipsPlaceholderTemplate = TipsPlaceholder(this.model);
  };

  private _onFocusIn = (e: FocusEvent) => {
    this._isFocus = true;
    this._updatePlaceholder();

    this.model.text.yText.observe(this._updatePlaceholder);
    this._placeholderDisposables.add(() =>
      this.model.text.yText.unobserve(this._updatePlaceholder)
    );
    // Workaround for virgo skips composition event
    this._placeholderDisposables.addFromEvent(this, 'compositionstart', () => {
      this._isComposing = true;
      this._updatePlaceholder();
    });
    this._placeholderDisposables.addFromEvent(this, 'compositionend', () => {
      this._isComposing = false;
      this._updatePlaceholder();
    });
  };

  private _onFocusOut = (e: FocusEvent) => {
    this._isFocus = false;
    this._updatePlaceholder();
    // We should not observe text change when focus out
    this._placeholderDisposables.dispose();
    this._placeholderDisposables = new DisposableGroup();
  };

  override render() {
    const { type } = this.model;
    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );

    // hide placeholder in database
    const tipsPlaceholderTemplate =
      this.host.flavour === 'affine:database'
        ? ''
        : this._tipsPlaceholderTemplate;

    return html`
      <div class="affine-paragraph-block-container ${type}">
        ${tipsPlaceholderTemplate}
        <rich-text
          .host=${this.host}
          .model=${this.model}
          .textSchema=${this.textSchema}
          @focusin=${this._onFocusIn}
          @focusout=${this._onFocusOut}
          style=${styleMap({
            fontWeight: /^h[1-6]$/.test(type) ? '600' : undefined,
          })}
        ></rich-text>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-paragraph': ParagraphBlockComponent;
  }
}
