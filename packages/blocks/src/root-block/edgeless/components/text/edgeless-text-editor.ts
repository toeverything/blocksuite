import '../../../../_common/components/rich-text/rich-text.js';

import {
  RangeManager,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import { isCssVariable } from '../../../../_common/theme/css-variables.js';
import { getLineHeight } from '../../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import type { TextElementModel } from '../../../../surface-block/element-model/text.js';
import { Bound, toRadian, Vec } from '../../../../surface-block/index.js';
import { wrapFontFamily } from '../../../../surface-block/utils/font.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { deleteElements } from '../../utils/crud.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-text-editor')
export class EdgelessTextEditor extends WithDisposable(ShadowlessElement) {
  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }

  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  static PLACEHOLDER_TEXT = 'Type from here';

  static HORIZONTAL_PADDING = 10;

  static VERTICAL_PADDING = 6;

  static BORDER_WIDTH = 1;

  static override styles = css`
    .edgeless-text-editor {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 10;
      transform-origin: left top;
      font-kerning: none;
      border: ${EdgelessTextEditor.BORDER_WIDTH}px solid
        var(--affine-primary-color, #1e96eb);
      border-radius: 4px;
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
      padding: ${EdgelessTextEditor.VERTICAL_PADDING}px
        ${EdgelessTextEditor.HORIZONTAL_PADDING}px;
      overflow: visible;
    }

    .edgeless-text-editor .inline-editor {
      white-space: pre-wrap !important;
      outline: none;
    }

    .edgeless-text-editor .inline-editor span {
      word-break: normal !important;
      overflow-wrap: anywhere !important;
    }

    .edgeless-text-editor-placeholder {
      pointer-events: none;
      color: var(--affine-text-disable-color);
      white-space: nowrap;
    }
  `;

  private _keeping = false;

  private _isComposition = false;

  @query('rich-text')
  accessor richText!: RichText;

  @property({ attribute: false })
  accessor element!: TextElementModel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  private _updateRect = () => {
    const edgeless = this.edgeless;
    const element = this.element;

    if (!edgeless || !element) return;

    const newWidth = this.inlineEditorContainer.scrollWidth;
    const newHeight = this.inlineEditorContainer.scrollHeight;
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

    edgeless.service.updateElement(element.id, {
      xywh: bound.serialize(),
    });
  };

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

  getVisualPosition(element: TextElementModel) {
    const { x, y, w, h, rotate } = element;
    return Vec.rotWith([x, y], [x + w / 2, y + h / 2], toRadian(rotate));
  }

  getContainerOffset() {
    const { VERTICAL_PADDING, HORIZONTAL_PADDING, BORDER_WIDTH } =
      EdgelessTextEditor;
    return `-${HORIZONTAL_PADDING + BORDER_WIDTH}px, -${
      VERTICAL_PADDING + BORDER_WIDTH
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

    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');
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
          edgeless.service.surface.elementUpdated.on(({ id }) => {
            if (id === element.id) this.requestUpdate();
          })
        );

        this.disposables.add(
          edgeless.service.viewport.viewportUpdated.on(() => {
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

          edgeless.service.selection.set({
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
    const {
      text,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      color,
      textAlign,
      rotate,
      hasMaxWidth,
      w,
    } = this.element;
    const lineHeight = getLineHeight(fontFamily, fontSize, fontWeight);
    const rect = getSelectedRect([this.element]);

    const { translateX, translateY, zoom } = this.edgeless.service.viewport;
    const [visualX, visualY] = this.getVisualPosition(this.element);
    const containerOffset = this.getContainerOffset();
    const transformOperation = [
      `translate(${translateX}px, ${translateY}px)`,
      `translate(${visualX * zoom}px, ${visualY * zoom}px)`,
      `scale(${zoom})`,
      `rotate(${rotate}deg)`,
      `translate(${containerOffset})`,
    ];

    const isEmpty = !text.length && !this._isComposition;

    return html`<div
      style=${styleMap({
        transform: transformOperation.join(' '),
        minWidth: hasMaxWidth ? `${rect.width}px` : 'none',
        maxWidth: hasMaxWidth ? `${w}px` : 'none',
        fontFamily: wrapFontFamily(fontFamily),
        fontSize: `${fontSize}px`,
        fontWeight,
        fontStyle,
        color: isCssVariable(color) ? `var(${color})` : color,
        textAlign,
        lineHeight: `${lineHeight}px`,
        boxSizing: 'content-box',
      })}
      class="edgeless-text-editor"
    >
      <rich-text
        .yText=${text}
        .enableFormat=${false}
        .enableAutoScrollHorizontally=${false}
        style=${isEmpty
          ? styleMap({
              position: 'absolute',
              left: 0,
              top: 0,
              padding: `${EdgelessTextEditor.VERTICAL_PADDING}px
        ${EdgelessTextEditor.HORIZONTAL_PADDING}px`,
            })
          : nothing}
      ></rich-text>
      ${isEmpty
        ? html`<span class="edgeless-text-editor-placeholder">
            Type from here
          </span>`
        : nothing}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-editor': EdgelessTextEditor;
  }
}
