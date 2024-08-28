import type CropperCanvas from './canvas.js';
import type CropperSelection from './selection.js';

import {
  ACTION_SELECT,
  CROPPER_CANVAS,
  CROPPER_SELECTION,
  CROPPER_SHADE,
  EVENT_ACTION_END,
  EVENT_ACTION_START,
  EVENT_CHANGE,
} from './constants.js';
import CropperElement from './element.js';
import { isNumber, off, on } from './functions.js';

const canvasCache = new WeakMap();

export default class CropperShade extends CropperElement {
  static override $name = CROPPER_SHADE;

  static override $version = '__VERSION__';

  protected $onCanvasActionEnd: EventListener | null = null;

  protected $onCanvasActionStart: EventListener | null = null;

  protected $onCanvasChange: EventListener | null = null;

  protected override $style = `
:host {
  display: block;
  height: 0;
  left: 0;
  outline: var(--theme-color) solid 1px;
  position: relative;
  top: 0;
  width: 0;
}

:host([transparent]) {
  outline-color: transparent;
}
`;

  height = 0;

  override slottable = false;

  override themeColor = 'rgba(0, 0, 0, 0.65)';

  width = 0;

  x = 0;

  y = 0;

  protected set $canvas(element: CropperCanvas) {
    canvasCache.set(this, element);
  }

  protected get $canvas(): CropperCanvas {
    return canvasCache.get(this);
  }

  static override get observedAttributes(): string[] {
    return super.observedAttributes.concat(['height', 'width', 'x', 'y']);
  }

  /**
   * Changes the position and/or size of the shade.
   * @param {number} x The new position in the horizontal direction.
   * @param {number} y The new position in the vertical direction.
   * @param {number} [width] The new width.
   * @param {number} [height] The new height.
   * @returns {CropperShade} Returns `this` for chaining.
   */
  $change(
    x: number,
    y: number,
    width: number = this.width,
    height: number = this.height
  ): this {
    if (
      !isNumber(x) ||
      !isNumber(y) ||
      !isNumber(width) ||
      !isNumber(height) ||
      (x === this.x &&
        y === this.y &&
        width === this.width &&
        height === this.height)
    ) {
      return this;
    }

    if (this.hidden) {
      this.hidden = false;
    }

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    return this.$render();
  }

  /**
   * Refreshes the position or size of the shade.
   * @returns {CropperShade} Returns `this` for chaining.
   */
  $render(): this {
    return this.$setStyles({
      transform: `translate(${this.x}px, ${this.y}px)`,
      width: this.width,
      height: this.height,
      outlineWidth: Math.max(
        this.$canvas.clientWidth,
        this.$canvas.clientHeight
      ),
    });
  }

  /**
   * Resets the shade to its initial position and size.
   * @returns {CropperShade} Returns `this` for chaining.
   */
  $reset(): this {
    return this.$change(0, 0, 0, 0);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const $canvas: CropperCanvas | null = this.closest(
      this.$getTagNameOf(CROPPER_CANVAS)
    );

    if ($canvas) {
      this.$canvas = $canvas;
      this.style.position = 'absolute';

      const $selection: CropperSelection | null = $canvas.querySelector(
        this.$getTagNameOf(CROPPER_SELECTION)
      );

      if ($selection) {
        this.$onCanvasActionStart = event => {
          if (
            $selection.hidden &&
            (event as CustomEvent).detail.action === ACTION_SELECT
          ) {
            this.hidden = false;
          }
        };
        this.$onCanvasActionEnd = event => {
          if (
            $selection.hidden &&
            (event as CustomEvent).detail.action === ACTION_SELECT
          ) {
            this.hidden = true;
          }
        };
        this.$onCanvasChange = event => {
          const { x, y, width, height } = (event as CustomEvent).detail;

          this.$change(x, y, width, height);

          if (
            $selection.hidden ||
            (x === 0 && y === 0 && width === 0 && height === 0)
          ) {
            this.hidden = true;
          }
        };
        on($canvas, EVENT_ACTION_START, this.$onCanvasActionStart);
        on($canvas, EVENT_ACTION_END, this.$onCanvasActionEnd);
        on($canvas, EVENT_CHANGE, this.$onCanvasChange);
      }
    }

    this.$render();
  }

  override disconnectedCallback(): void {
    const { $canvas } = this;

    if ($canvas) {
      if (this.$onCanvasActionStart) {
        off($canvas, EVENT_ACTION_START, this.$onCanvasActionStart);
        this.$onCanvasActionStart = null;
      }

      if (this.$onCanvasActionEnd) {
        off($canvas, EVENT_ACTION_END, this.$onCanvasActionEnd);
        this.$onCanvasActionEnd = null;
      }

      if (this.$onCanvasChange) {
        off($canvas, EVENT_CHANGE, this.$onCanvasChange);
        this.$onCanvasChange = null;
      }
    }

    super.disconnectedCallback();
  }
}
