import '../_common/components/rich-text/rich-text.js';

import { DisposableGroup } from '@blocksuite/global/utils';
import { BlockElement, getVRangeProvider } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import type { VRangeProvider } from '@blocksuite/virgo';
import { css, html, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { bindContainerHotkey } from '../_common/components/rich-text/keymap/index.js';
import type { RichText } from '../_common/components/rich-text/rich-text.js';
import { affineAttributeRenderer } from '../_common/components/rich-text/virgo/attribute-renderer.js';
import { affineTextAttributes } from '../_common/components/rich-text/virgo/types.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import { BlockHubIcon20 } from '../_common/icons/index.js';
import { isPageMode, matchFlavours } from '../_common/utils/index.js';
import type { ParagraphBlockModel, ParagraphType } from './paragraph-model.js';

function tipsPlaceholderPreventDefault(event: Event) {
  // Call event.preventDefault() to keep the mouse event from being sent as well.
  // https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
  event.preventDefault();
}

interface Style {
  [name: string]: string;
}

function TipsPlaceholder(model: BaseBlockModel, tipsPos: Style) {
  if (!matchFlavours(model, ['affine:paragraph'])) {
    throw new Error("TipsPlaceholder can't be used for this model");
  }
  if (model.type === 'text') {
    if (!isPageMode(model.page)) {
      return html`<div class="tips-placeholder" style=${styleMap(tipsPos)}>
        Type '/' for commands
      </div> `;
    }

    const blockHub = document.querySelector('affine-block-hub');
    if (!blockHub) {
      // Fall back
      return html`<div class="tips-placeholder" style=${styleMap(tipsPos)}>
        Type '/' for commands
      </div>`;
    }
    const onClick = () => {
      if (!blockHub) {
        throw new Error('Failed to find blockHub!');
      }
      blockHub.toggleMenu();
    };
    return html`
      <div
        class="tips-placeholder"
        @click=${onClick}
        @pointerdown=${tipsPlaceholderPreventDefault}
        style=${styleMap(tipsPos)}
      >
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
export class ParagraphBlockComponent extends BlockElement<ParagraphBlockModel> {
  static override styles = css`
    .affine-paragraph-block-container {
      position: relative;
      border-radius: 4px;
    }
    .affine-paragraph-rich-text-wrapper {
      position: relative;
    }
    code {
      font-size: calc(var(--affine-font-base) - 4px);
    }
    .h1 {
      font-size: var(--affine-font-h-1);
      line-height: calc(1em + 12px);
      margin-top: 18px;
      margin-bottom: 10px;
    }
    .h1 code {
      font-size: calc(var(--affine-font-base) + 8px);
    }
    .h2 {
      font-size: var(--affine-font-h-2);
      line-height: calc(1em + 10px);
      margin-top: 14px;
      margin-bottom: 10px;
    }
    .h2 code {
      font-size: calc(var(--affine-font-base) + 6px);
    }
    .h3 {
      font-size: var(--affine-font-h-3);
      line-height: calc(1em + 8px);
      margin-top: 12px;
      margin-bottom: 10px;
    }
    .h3 code {
      font-size: calc(var(--affine-font-base) + 4px);
    }
    .h4 {
      font-size: var(--affine-font-h-4);
      line-height: calc(1em + 10px);
      margin-top: 12px;
      margin-bottom: 10px;
    }
    .h4 code {
      font-size: calc(var(--affine-font-base) + 2px);
    }
    .h5 {
      font-size: var(--affine-font-h-5);
      line-height: calc(1em + 8px);
      margin-top: 12px;
      margin-bottom: 10px;
    }
    .h5 code {
      font-size: calc(var(--affine-font-base));
    }
    .h6 {
      font-size: var(--affine-font-h-6);
      line-height: calc(1em + 8px);
      margin-top: 12px;
      margin-bottom: 10px;
    }
    .h6 code {
      font-size: calc(var(--affine-font-base) - 2px);
    }
    .quote {
      line-height: 26px;
      padding-left: 17px;
      margin-top: var(--affine-paragraph-space);
      padding-top: 10px;
      padding-bottom: 10px;
      position: relative;
    }
    .quote::after {
      content: '';
      width: 2px;
      height: calc(100% - 20px);
      margin-top: 10px;
      margin-bottom: 10px;
      position: absolute;
      left: 0;
      top: 0;
      background: var(--affine-quote-color);
      border-radius: 18px;
    }
    .text {
      margin-top: 10px;
      margin-bottom: 10px;
      font-size: var(--affine-font-base);
    }

    .tips-placeholder {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 4px;
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

  @state()
  tipsPos = { top: '50%', transform: 'translateY(-50%)', left: '2px' };

  @state()
  private _tipsPlaceholderTemplate = html``;

  @state()
  private _isComposing = false;

  @state()
  private _isFocus = false;

  readonly attributesSchema = affineTextAttributes;
  readonly attributeRenderer = affineAttributeRenderer;

  private _placeholderDisposables = new DisposableGroup();

  private _vRangeProvider: VRangeProvider | null = null;

  @query('rich-text')
  private _richTextElement?: RichText;

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Initial placeholder state
    this._updatePlaceholder();
    bindContainerHotkey(this);

    this._vRangeProvider = getVRangeProvider(this);
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

    if (this._richTextElement) {
      const parentRect =
        this._richTextElement.parentElement?.getBoundingClientRect() as DOMRect;
      const rect = this._richTextElement.getBoundingClientRect();

      const relativeTop = rect.top - parentRect.top;
      const relativeLeft = rect.left - parentRect.left;
      this.tipsPos = {
        top: `${relativeTop}px`,
        transform: '',
        left: `${relativeLeft + 2}px`,
      };
    }

    this._tipsPlaceholderTemplate = TipsPlaceholder(this.model, this.tipsPos);
  };

  private _onFocusIn = () => {
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

  private _onFocusOut = () => {
    this._isFocus = false;
    this._updatePlaceholder();
    // We should not observe text change when focus out
    this._placeholderDisposables.dispose();
    this._placeholderDisposables = new DisposableGroup();
  };

  private isInDatabase = () => {
    let parent = this.parentElement;
    while (parent && parent !== document.body) {
      if (parent.tagName.toLowerCase() === 'affine-database') {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  };

  override render(): TemplateResult<1> {
    const { type } = this.model;

    // hide placeholder in database
    const tipsPlaceholderTemplate = this.isInDatabase()
      ? ''
      : this._tipsPlaceholderTemplate;

    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.content}
    </div>`;

    return html`
      <div class="affine-paragraph-block-container ${type}">
        <div class="affine-paragraph-rich-text-wrapper">
          ${tipsPlaceholderTemplate}
          <rich-text
            .yText=${this.model.text.yText}
            .undoManager=${this.model.page.history}
            .attributesSchema=${this.attributesSchema}
            .attributeRenderer=${this.attributeRenderer}
            .readonly=${this.model.page.readonly}
            .vRangeProvider=${this._vRangeProvider}
            .enableClipboard=${false}
            .enableUndoRedo=${false}
            @focusin=${this._onFocusIn}
            @focusout=${this._onFocusOut}
            style=${styleMap({
              fontWeight: /^h[1-6]$/.test(type) ? '600' : undefined,
            })}
          ></rich-text>
        </div>
        ${children}
        ${when(
          this.selected?.is('block'),
          () => html`<affine-block-selection></affine-block-selection>`
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-paragraph': ParagraphBlockComponent;
  }
}
