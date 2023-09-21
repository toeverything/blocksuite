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
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { deleteElements } from '../../utils/crud.js';

@customElement('edgeless-text-editor')
export class EdgelessTextEditor extends WithDisposable(ShadowlessElement) {
  static PLACEHOLDER_TEXT = 'Type from here';
  static override styles = css`
    .edgeless-text-editor {
      --horizontal-padding: 10px;
      --vertical-padding: 6px;
      --border-width: 1px;

      min-width: fit-content;
      position: absolute;
      z-index: 10;
      margin-right: -100%;
      border: var(--border-width) solid var(--affine-primary-color, #1e96eb);
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
      border-radius: 4px;
      padding: var(--vertical-padding) var(--horizontal-padding);
      transform-origin: left top;
      line-height: initial;
    }

    .edgeless-text-editor-placeholder {
      left: var(--horizontal-padding);
      top: var(--vertical-padding);
      pointer-events: none;
      font-size: 12px;
      color: var(--affine-text-disable-color);
      white-space: nowrap;
    }

    .edgeless-text-editor .virgo-container {
      outline: none;
    }
  `;

  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vInput: VirgoInput | null = null;
  get vEditor() {
    assertExists(this._vInput);
    return this._vInput.vEditor;
  }

  private _element: TextElement | null = null;
  private _edgeless: EdgelessPageBlockComponent | null = null;
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
    // Step 1
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;

    // Step 2
    let deltaXPrime =
      (rect.w / 2) * Math.cos(rect.r) - (-rect.h / 2) * Math.sin(rect.r);
    let deltaYPrime =
      (rect.w / 2) * Math.sin(rect.r) + (-rect.h / 2) * Math.cos(rect.r);

    // Step 3
    const vX = centerX + deltaXPrime;
    const vY = centerY + deltaYPrime;

    // Step 4
    deltaXPrime = (w1 / 2) * Math.cos(rect.r) - (-h1 / 2) * Math.sin(rect.r);
    deltaYPrime = (w1 / 2) * Math.sin(rect.r) + (-h1 / 2) * Math.cos(rect.r);

    // Step 5
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
    const newWidth = this._virgoContainer.offsetWidth;
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
      yText: this._element.text,
    });

    this._vInput.vEditor.slots.updated.on(() => {
      this._updateRect();
      this.requestUpdate();
    });

    this._disposables.add(
      this._edgeless.surface.slots.elementUpdated.on(({ id }) => {
        if (id === this._element?.id) {
          this.requestUpdate();
        }
      })
    );

    this.requestUpdate();

    requestAnimationFrame(() => {
      assertExists(this._vInput);
      assertExists(this._element);

      this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
        display: false,
      });
      this._vInput.mount(this._virgoContainer);

      const dispatcher = this._edgeless?.dispatcher;
      assertExists(dispatcher);
      this._disposables.addFromEvent(this._virgoContainer, 'blur', () => {
        if (this._keeping) return;
        this._unmount();
      });
      this._disposables.add(
        dispatcher.add('click', () => {
          return true;
        })
      );
      this._disposables.add(
        dispatcher.add('doubleClick', () => {
          return true;
        })
      );
      this._disposables.addFromEvent(
        this._virgoContainer,
        'compositionstart',
        () => {
          this._isComposition = true;
          this.requestUpdate();
        }
      );
      this._disposables.addFromEvent(
        this._virgoContainer,
        'compositionend',
        () => {
          this._isComposition = false;
          this.requestUpdate();
        }
      );
    });
  }

  private _unmount() {
    this._vInput?.unmount();
    assertExists(this._element);
    assertExists(this._edgeless);
    this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
      display: true,
    });

    if (this._element?.text.length === 0) {
      deleteElements(this._edgeless.surface, [this._element]);
    }

    this.remove();
    assertExists(this._edgeless);
    this._edgeless.selectionManager.setSelection({
      elements: [],
      editing: false,
    });
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

  override render() {
    if (!this._element) return nothing;

    const placeholder = this._renderPlaceholder();
    const { x, y, fontFamily, fontSize, textAlign } = this._element;
    const hasPlaceholder = placeholder !== nothing;

    return html`<div
      style=${styleMap({
        textAlign,
        fontFamily,
        left: `calc((${
          x - 1
        }px - var(--horizontal-padding)) * var(--affine-zoom))`,
        top: `calc((${
          y - 1
        }px - var(--vertical-padding)) * var(--affine-zoom))`,
        fontSize: `${fontSize}px`,
        transform: `translate(var(--affine-edgeless-x), var(--affine-edgeless-y)) scale(var(--affine-zoom)) translate(50%, 50%)  rotate(${this._element.rotate}deg) translate(-50%, -50%)`,
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
