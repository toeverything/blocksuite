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
      top: 0;
      left: 0;
      z-index: 10;
      margin: 0;
      border: ${EdgelessTextEditor.BORDER_WIDTH}px solid
        var(--affine-primary-color, #1e96eb);
      border-radius: 4px;
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
      padding: ${EdgelessTextEditor.VERTICAL_PADDING}px
        ${EdgelessTextEditor.HORIZONTAL_PADDING}px;
      line-height: initial;
      overflow: visible;
      box-sizing: content-box;
    }

    .edgeless-text-editor .inline-editor-container {
      white-space: nowrap;
      outline: none;
      width: fit-content;
    }

    .edgeless-text-editor .inline-editor-container span {
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

  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }
  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  private _keeping = false;
  private _isComposition = false;

  private _renderPlaceholder() {
    if (this.element.text.length === 0 && !this._isComposition) {
      return html`<div
        class="edgeless-text-editor-placeholder"
        style=${styleMap({
          fontSize: this.element.fontSize + 'px',
          pointerEvents: `none`,
          color: `var(--affine-text-disable-color)`,
          whiteSpace: `nowrap`,
          textAlign: this.element.textAlign,
        })}
      >
        Type from here
      </div>`;
    }

    return nothing;
  }

  setKeeping(keeping: boolean) {
    this._keeping = keeping;
  }

  getCoords(
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

    const newWidth = this.inlineEditorContainer.scrollWidth;
    const newHeight = this.inlineEditorContainer.scrollHeight;
    const bound = new Bound(element.x, element.y, newWidth, newHeight);
    const { x, y, w, h, rotate } = element;
    const newPos = this.getCoords(
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
    edgeless.surface.updateElement(element.id, {
      xywh: bound.serialize(),
    });
  }

  getVisualPosition(element: TextElement) {
    const { x, y, w, h, rotate } = element;
    return Vec.rotWith([x, y], [x + w / 2, y + h / 2], toRadian(rotate));
  }

  getPaddingOffset() {
    const { VERTICAL_PADDING, HORIZONTAL_PADDING, BORDER_WIDTH } =
      EdgelessTextEditor;
    const { zoom } = this.edgeless.surface.viewport;
    return `-${(HORIZONTAL_PADDING + BORDER_WIDTH) * zoom}px, -${
      (VERTICAL_PADDING + BORDER_WIDTH) * zoom
    }px`;
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

    this.updateComplete
      .then(() => {
        this.inlineEditor.slots.renderComplete.on(() => {
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
          element.display = true;

          if (element.text.length === 0) {
            deleteElements(edgeless.surface, [element]);
          }

          edgeless.selectionManager.set({
            elements: [],
            editing: false,
          });
        });
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'blur',
          () => !this._keeping && this.remove()
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'compositionstart',
          () => {
            this._isComposition = true;
            this.requestUpdate();
          }
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'compositionend',
          () => {
            this._isComposition = false;
            this.requestUpdate();
          }
        );

        element.display = false;
      })
      .catch(console.error);
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override render() {
    const { translateX, translateY, zoom } = this.edgeless.surface.viewport;
    const [x, y] = this.getVisualPosition(this.element);
    const {
      fontFamily,
      fontSize,
      textAlign,
      rotate,
      fontWeight,
      w,
      hasMaxWidth,
    } = this.element;
    const paddingOffset = this.getPaddingOffset();
    const rect = getSelectedRect([this.element]);
    const transformOperation = [
      `translate(${translateX}px, ${translateY}px)`,
      `translate(${x * zoom}px, ${y * zoom}px)`,
      `translate(${paddingOffset})`,
      `scale(${zoom})`,
      `rotate(${rotate}deg)`,
    ];

    const placeholder = this._renderPlaceholder();
    const hasPlaceholder = placeholder !== nothing;

    return html`<div
      style=${styleMap({
        fontFamily: wrapFontFamily(fontFamily),
        minWidth: hasMaxWidth ? `${rect.width}px` : 'none',
        maxWidth: hasMaxWidth ? `${w}px` : 'none',
        fontSize: `${fontSize}px`,
        fontWeight,
        textAlign,
        transform: transformOperation.join(' '),
        transformOrigin: 'left top',
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
              left: 0,
              top: 0,
              padding: `${EdgelessTextEditor.VERTICAL_PADDING}px
        ${EdgelessTextEditor.HORIZONTAL_PADDING}px`,
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
