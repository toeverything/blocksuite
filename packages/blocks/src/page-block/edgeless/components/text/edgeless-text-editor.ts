import '../../../../_common/components/rich-text/rich-text.js';

import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import { isCssVariable } from '../../../../_common/theme/css-variables.js';
import { wrapFontFamily } from '../../../../surface-block/elements/text/utils.js';
import {
  Bound,
  type TextElement,
  toRadian,
  Vec,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { deleteElements } from '../../utils/crud.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-text-editor')
export class EdgelessTextEditor extends WithDisposable(ShadowlessElement) {
  static PLACEHOLDER_TEXT = 'Type from here';
  static HORIZONTAL_PADDING = 10;
  static VERTICAL_PADDING = 6;
  static BORDER_WIDTH = 1;

  static override styles = css`
    .edgeless-text-editor {
      position: absolute;
      z-index: 10;
      margin-right: -100%;
      border: ${EdgelessTextEditor.BORDER_WIDTH}px solid
        var(--affine-primary-color, #1e96eb);
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
      border-radius: 4px;
      padding: ${EdgelessTextEditor.VERTICAL_PADDING}px
        ${EdgelessTextEditor.HORIZONTAL_PADDING}px;
      line-height: initial;
      overflow: visible;
      box-sizing: content-box;
      left: 0;
      top: 0;
    }

    .edgeless-text-editor-placeholder {
      font-size: 12px;
      pointer-events: none;
      color: var(--affine-text-disable-color);
      white-space: nowrap;
    }

    .edgeless-text-editor .virgo-container {
      white-space: nowrap;
      outline: none;
      width: fit-content;
    }

    .edgeless-text-editor .virgo-container span {
      white-space: pre !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
    }
  `;

  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  element!: TextElement;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  get vEditor() {
    assertExists(this.richText.vEditor);
    return this.richText.vEditor;
  }
  get vEditorContainer() {
    return this.vEditor.rootElement;
  }

  private _keeping = false;
  private _isComposition = false;

  setKeeping(keeping: boolean) {
    this._keeping = keeping;
  }

  getCoordsOnRightAlign(
    rect: { w: number; h: number; r: number; x: number; y: number },
    w1: number,
    h1: number
  ): { x: number; y: number } {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;

    let deltaXPrime =
      (rect.w / 2) * Math.cos(rect.r) - (-rect.h / 2) * Math.sin(rect.r);
    let deltaYPrime =
      (rect.w / 2) * Math.sin(rect.r) + (-rect.h / 2) * Math.cos(rect.r);

    const vX = centerX + deltaXPrime;
    const vY = centerY + deltaYPrime;

    deltaXPrime = (w1 / 2) * Math.cos(rect.r) - (-h1 / 2) * Math.sin(rect.r);
    deltaYPrime = (w1 / 2) * Math.sin(rect.r) + (-h1 / 2) * Math.cos(rect.r);

    const newCenterX = vX - deltaXPrime;
    const newCenterY = vY - deltaYPrime;

    return { x: newCenterX - w1 / 2, y: newCenterY - h1 / 2 };
  }

  getCoordsOnCenterAlign(
    rect: { w: number; h: number; r: number; x: number; y: number },
    w1: number,
    h1: number
  ): { x: number; y: number } {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;

    let deltaXPrime = 0;
    let deltaYPrime = (-rect.h / 2) * Math.cos(rect.r);

    const vX = centerX + deltaXPrime;
    const vY = centerY + deltaYPrime;

    deltaXPrime = 0;
    deltaYPrime = (-h1 / 2) * Math.cos(rect.r);

    const newCenterX = vX - deltaXPrime;
    const newCenterY = vY - deltaYPrime;

    return { x: newCenterX - w1 / 2, y: newCenterY - h1 / 2 };
  }

  getCoordsOnLeftAlign(
    rect: { w: number; h: number; r: number; x: number; y: number },
    w1: number,
    h1: number
  ): { x: number; y: number } {
    const cX = rect.x + rect.w / 2;
    const cY = rect.y + rect.h / 2;

    let deltaXPrime =
      (-rect.w / 2) * Math.cos(rect.r) + (rect.h / 2) * Math.sin(rect.r);
    let deltaYPrime =
      (-rect.w / 2) * Math.sin(rect.r) - (rect.h / 2) * Math.cos(rect.r);

    const vX = cX + deltaXPrime;
    const vY = cY + deltaYPrime;

    deltaXPrime = (-w1 / 2) * Math.cos(rect.r) + (h1 / 2) * Math.sin(rect.r);
    deltaYPrime = (-w1 / 2) * Math.sin(rect.r) - (h1 / 2) * Math.cos(rect.r);

    const newCenterX = vX - deltaXPrime;
    const newCenterY = vY - deltaYPrime;

    return { x: newCenterX - w1 / 2, y: newCenterY - h1 / 2 };
  }

  private _updateRect() {
    const edgeless = this.edgeless;
    const element = this.element;

    if (!edgeless || !element) return;

    const newWidth = this.vEditorContainer.scrollWidth;
    const newHeight = this.vEditorContainer.scrollHeight;
    const bound = new Bound(element.x, element.y, newWidth, newHeight);
    const { x, y, w, h, rotate } = element;

    switch (element.textAlign) {
      case 'left':
        {
          const newPos = this.getCoordsOnLeftAlign(
            {
              x,
              y,
              w,
              h,
              r: toRadian(rotate),
            },
            newWidth,
            newHeight
          );

          bound.x = newPos.x;
          bound.y = newPos.y;
        }
        break;
      case 'center':
        {
          const newPos = this.getCoordsOnCenterAlign(
            {
              x,
              y,
              w,
              h,
              r: toRadian(rotate),
            },
            newWidth,
            newHeight
          );

          bound.x = newPos.x;
          bound.y = newPos.y;
        }
        break;
      case 'right':
        {
          const newPos = this.getCoordsOnRightAlign(
            {
              x,
              y,
              w,
              h,
              r: toRadian(rotate),
            },
            newWidth,
            newHeight
          );

          bound.x = newPos.x;
          bound.y = newPos.y;
        }
        break;
    }

    edgeless.surface.updateElement(element.id, {
      xywh: bound.serialize(),
    });
  }

  private _renderPlaceholder() {
    if (this.element.text.length === 0 && !this._isComposition) {
      return html`<span
        class="edgeless-text-editor-placeholder"
        style=${styleMap({
          fontSize: this.element.fontSize + 'px',
        })}
        >Type from here</span
      >`;
    }

    return nothing;
  }

  getTransformOrigin(textAlign: TextElement['textAlign']) {
    switch (textAlign) {
      case 'left':
        return 'left top';
      case 'center':
        return 'center top';
      case 'right':
        return 'right top';
    }
  }

  getTransformOffset(textAlign: TextElement['textAlign']) {
    switch (textAlign) {
      case 'left':
        return '0%, 0%';
      case 'center':
        return '-50%, 0%';
      case 'right':
        return '-100%, 0%';
    }
  }

  getVisualPosition(element: TextElement) {
    const { x, y, w, h, rotate, textAlign } = element;
    switch (textAlign) {
      case 'left':
        return Vec.rotWith([x, y], [x + w / 2, y + h / 2], toRadian(rotate));
      case 'center':
        return Vec.rotWith(
          [x + w / 2, y],
          [x + w / 2, y + h / 2],
          toRadian(rotate)
        );
      case 'right':
        return Vec.rotWith(
          [x + w, y],
          [x + w / 2, y + h / 2],
          toRadian(rotate)
        );
    }
  }

  getPaddingOffset(textAlign: TextElement['textAlign']) {
    const { VERTICAL_PADDING, HORIZONTAL_PADDING, BORDER_WIDTH } =
      EdgelessTextEditor;

    switch (textAlign) {
      case 'left':
        return `-${HORIZONTAL_PADDING + BORDER_WIDTH}px, -${
          VERTICAL_PADDING + BORDER_WIDTH
        }px`;
      case 'center':
        return `${BORDER_WIDTH}px, -${VERTICAL_PADDING + BORDER_WIDTH}px`;
      case 'right':
        return `${HORIZONTAL_PADDING + BORDER_WIDTH * 3}px, -${
          VERTICAL_PADDING + BORDER_WIDTH
        }px`;
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.edgeless) {
      throw new Error('edgeless is not set.');
    }
    if (!this.element) {
      throw new Error('text element is not set.');
    }
  }

  override firstUpdated(): void {
    const edgeless = this.edgeless;
    const element = this.element;
    const { dispatcher } = this.edgeless;
    assertExists(dispatcher);

    this.updateComplete.then(() => {
      this.vEditor.slots.updated.on(() => {
        this._updateRect();
        this.requestUpdate();
      });

      this.disposables.add(
        edgeless.slots.elementUpdated.on(({ id }) => {
          if (id === element.id) this.requestUpdate();
        })
      );
      this.disposables.add(
        edgeless.surface.viewport.slots.viewportUpdated.on(() => {
          this.requestUpdate();
        })
      );
      this.disposables.add(dispatcher.add('click', () => true));
      this.disposables.add(dispatcher.add('doubleClick', () => true));
      this.disposables.add(() => {
        edgeless.localRecord.update(element.id, {
          display: true,
        });

        if (element.text.length === 0) {
          deleteElements(edgeless.surface, [element]);
        }

        edgeless.selectionManager.setSelection({
          elements: [],
          editing: false,
        });
      });
      this.disposables.addFromEvent(
        this.vEditorContainer,
        'blur',
        () => !this._keeping && this.remove()
      );
      this.disposables.addFromEvent(
        this.vEditorContainer,
        'compositionstart',
        () => {
          this._isComposition = true;
          this.requestUpdate();
        }
      );
      this.disposables.addFromEvent(
        this.vEditorContainer,
        'compositionend',
        () => {
          this._isComposition = false;
          this.requestUpdate();
        }
      );

      edgeless.localRecord.update(element.id, {
        display: false,
      });
    });
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override render() {
    const { zoom, translateX, translateY } = this.edgeless.surface.viewport;
    const { fontFamily, fontSize, textAlign, rotate, fontWeight } =
      this.element;
    const transformOrigin = this.getTransformOrigin(textAlign);
    const offset = this.getTransformOffset(textAlign);
    const paddingOffset = this.getPaddingOffset(textAlign);
    const rect = getSelectedRect([this.element]);
    const hasMaxWidth = this.element.hasMaxWidth;
    const w = this.element.w;
    const [x, y] = this.getVisualPosition(this.element);
    const placeholder = this._renderPlaceholder();
    const hasPlaceholder = placeholder !== nothing;

    const transformOperation = [
      `translate(${translateX}px, ${translateY}px)`,
      `translate(${x * zoom}px, ${y * zoom}px)`,
      `translate(${offset})`,
      `scale(${zoom})`,
      `rotate(${rotate}deg)`,
      `translate(${paddingOffset})`,
    ];
    const left =
      textAlign === 'left'
        ? EdgelessTextEditor.HORIZONTAL_PADDING + 'px'
        : textAlign === 'center'
        ? '50%'
        : `calc(100% - ${EdgelessTextEditor.HORIZONTAL_PADDING}px)`;

    return html`<div
      style=${styleMap({
        textAlign,
        fontFamily: wrapFontFamily(fontFamily),
        minWidth: hasMaxWidth ? `${rect.width}px` : 'none',
        maxWidth: hasMaxWidth ? `${w}px` : 'none',
        fontSize: `${fontSize}px`,
        fontWeight,
        transform: transformOperation.join(' '),
        transformOrigin,
        color: isCssVariable(this.element.color)
          ? `var(${this.element.color})`
          : this.element.color,
      })}
      class="edgeless-text-editor"
    >
      <rich-text
        .yText=${this.element.text}
        .enableFormat=${false}
        .enableAutoScrollHorizontally=${false}
        .enableAutoScrollVertically=${false}
        style=${hasPlaceholder
          ? styleMap({
              position: 'absolute',
              minWidth: '2px',
              top: EdgelessTextEditor.VERTICAL_PADDING + 'px',
              left,
            })
          : nothing}
      ></rich-text>
      ${placeholder}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-editor': EdgelessTextEditor;
  }
}
