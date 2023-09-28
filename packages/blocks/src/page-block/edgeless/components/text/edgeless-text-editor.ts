import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isCssVariable } from '../../../../__internal__/theme/css-variables.js';
import { VirgoInput } from '../../../../components/virgo-input/virgo-input.js';
import {
  Bound,
  type TextElement,
  toRadian,
  Vec,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { deleteElements } from '../../utils/crud.js';

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

  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vInput!: VirgoInput;
  get vEditor() {
    assertExists(this._vInput);
    return this._vInput.vEditor;
  }

  private _element!: TextElement;
  private _edgeless!: EdgelessPageBlockComponent;
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
    const edgeless = this._edgeless;
    const element = this._element;

    if (!edgeless || !element) return;

    const lines = Array.from(this._virgoContainer.querySelectorAll('v-line'));
    const lineHeight = lines[0].offsetHeight;
    const newWidth = this._virgoContainer.scrollWidth;
    const newHeight = lines.length * lineHeight;
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

  mount(element: TextElement, edgeless: EdgelessPageBlockComponent) {
    this._element = element;
    this._edgeless = edgeless;
    this._vInput = new VirgoInput({
      yText: element.text,
    });

    const { _disposables } = this;
    const { dispatcher } = edgeless;
    const { _vInput: vInput } = this;

    assertExists(dispatcher);

    vInput.vEditor.slots.updated.on(() => {
      this._updateRect();
      this.requestUpdate();
    });

    _disposables.add(
      edgeless.surface.slots.elementUpdated.on(({ id }) => {
        if (id === element.id) this.requestUpdate();
      })
    );
    _disposables.add(dispatcher.add('click', () => true));
    _disposables.add(dispatcher.add('doubleClick', () => true));
    _disposables.add(() => {
      edgeless.surface.updateElementLocalRecord(element.id, {
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

    _disposables.add(
      edgeless.surface.viewport.slots.viewportUpdated.on(() => {
        this.requestUpdate();
      })
    );

    edgeless.surface.updateElementLocalRecord(this._element.id, {
      display: false,
    });

    this.requestUpdate();
    this.updateComplete.then(() => {
      vInput.mount(this._virgoContainer);
      _disposables.addFromEvent(
        this._virgoContainer,
        'blur',
        () => !this._keeping && this._unmount()
      );
      _disposables.addFromEvent(
        this._virgoContainer,
        'compositionstart',
        () => {
          this._isComposition = true;
          this.requestUpdate();
        }
      );
      _disposables.addFromEvent(this._virgoContainer, 'compositionend', () => {
        this._isComposition = false;
        this.requestUpdate();
      });
    });
  }

  private _unmount() {
    this._vInput.unmount();
    this.remove();
  }

  _renderPlaceholder() {
    if (this._vInput?.yText.length === 0 && !this._isComposition) {
      return html`<span
        class="edgeless-text-editor-placeholder"
        style=${styleMap({
          fontSize: this._element?.fontSize + 'px',
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

  override render() {
    if (!this._element) return nothing;

    const { zoom, translateX, translateY } = this._edgeless.surface.viewport;
    const { fontFamily, fontSize, textAlign } = this._element;
    const transformOrigin = this.getTransformOrigin(textAlign);
    const offset = this.getTransformOffset(textAlign);
    const paddingOffset = this.getPaddingOffset(textAlign);
    const [x, y] = this.getVisualPosition(this._element);
    const placeholder = this._renderPlaceholder();
    const hasPlaceholder = placeholder !== nothing;

    const transformOperation = [
      `translate(${translateX}px, ${translateY}px)`,
      `translate(${x * zoom}px, ${y * zoom}px)`,
      `translate(${offset})`,
      `scale(${zoom})`,
      `rotate(${this._element.rotate}deg)`,
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
        fontFamily,
        fontSize: `${fontSize}px`,
        transform: transformOperation.join(' '),
        transformOrigin,
        color: isCssVariable(this._element.color)
          ? `var(${this._element.color})`
          : this._element.color,
      })}
      class="edgeless-text-editor"
    >
      <div
        class="virgo-container"
        style=${hasPlaceholder
          ? styleMap({
              position: 'absolute',
              minWidth: '2px',
              top: EdgelessTextEditor.VERTICAL_PADDING + 'px',
              left,
            })
          : nothing}
      ></div>
      ${placeholder}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-editor': EdgelessTextEditor;
  }
}
