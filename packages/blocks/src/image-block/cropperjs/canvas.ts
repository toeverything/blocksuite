import type { EditorHost } from '@blocksuite/block-std';
import type { Viewport } from '@blocksuite/block-std/gfx';
import type { IVec } from '@blocksuite/global/utils';

import type { EdgelessRootService } from '../../root-block/index.js';
import type CropperImage from './image.js';

import {
  ACTION_NONE,
  ACTION_ROTATE,
  ACTION_SCALE,
  ACTION_TRANSFORM,
  ATTRIBUTE_ACTION,
  CROPPER_CANVAS,
  CROPPER_IMAGE,
  EVENT_ACTION,
  EVENT_ACTION_END,
  EVENT_ACTION_MOVE,
  EVENT_ACTION_START,
  EVENT_POINTER_DOWN,
  EVENT_POINTER_MOVE,
  EVENT_POINTER_UP,
  EVENT_WHEEL,
} from './constants.js';
import CropperElement from './element.js';
import {
  getAdjustedSizes,
  isElement,
  isFunction,
  isNumber,
  isPlainObject,
  isPositiveNumber,
  isString,
  off,
  on,
} from './functions.js';

interface ActionEventData {
  action: string;
  relatedEvent: Event;
  scale?: number;
  rotate?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  centerX?: number;
  centerY?: number;
}

export default class CropperCanvas extends CropperElement {
  static override $name = CROPPER_CANVAS;

  static override $version = '__VERSION__';

  $action = ACTION_NONE;

  protected $onPointerDown: EventListener | null = null;

  protected $onPointerMove: EventListener | null = null;

  protected $onPointerUp: EventListener | null = null;

  protected $onWheel: EventListener | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly $pointers = new Map<number, any>();

  protected override $style = `
:host {
  display: block;
  min-height: 100px;
  min-width: 200px;
  overflow: hidden;
  position: relative;
  touch-action: none;
  -webkit-touch-callout: none;
  user-select: none;
}

:host([background]) {
  background-color: #fff;
  background-image: repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
  background-image: repeating-conic-gradient(#ccc 0 25%, #fff 0 50%);
  background-position: 0 0, 0.5rem 0.5rem;
  background-size: 1rem 1rem;
}

:host([disabled]) {
  pointer-events: none;
}

:host([disabled])::after {
  bottom: 0;
  content: "";
  cursor: not-allowed;
  display: block;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
}
`;

  protected $wheeling = false;

  background = false;

  blockId = '';

  disabled = false;

  scaleStep = 0.1;

  override themeColor = '#39f';

  private get imageContainerBlock() {
    const editorHost = document.querySelector('editor-host') as EditorHost;
    return editorHost.view.getBlock(this.blockId)!;
  }

  static override get observedAttributes(): string[] {
    return super.observedAttributes.concat([
      'background',
      'disabled',
      'scale-step',
      'block-id',
    ]);
  }

  private get viewport(): Viewport {
    const editorHost = document.querySelector('editor-host') as EditorHost;
    return (editorHost.std.getService('affine:page') as EdgelessRootService)
      .viewport;
  }

  private viewportTransformBack(original: IVec): IVec {
    const [modelX, modelY] = this.viewport.toModelCoord(
      original[0],
      original[1]
    );
    return [
      modelX - this.imageContainerBlock.offsetLeft,
      modelY - this.imageContainerBlock.offsetTop,
    ];
  }

  protected $bind(): void {
    if (!this.$onPointerDown) {
      this.$onPointerDown = this.$handlePointerDown.bind(this);
      on(this, EVENT_POINTER_DOWN, this.$onPointerDown);
    }

    if (!this.$onPointerMove) {
      this.$onPointerMove = this.$handlePointerMove.bind(this);
      on(this.ownerDocument, EVENT_POINTER_MOVE, this.$onPointerMove);
    }

    if (!this.$onPointerUp) {
      this.$onPointerUp = this.$handlePointerUp.bind(this);
      on(this.ownerDocument, EVENT_POINTER_UP, this.$onPointerUp);
    }

    if (!this.$onWheel) {
      this.$onWheel = this.$handleWheel.bind(this);
      on(this, EVENT_WHEEL, this.$onWheel, {
        passive: false,
        capture: true,
      });
    }
  }

  protected $handlePointerDown(event: Event): void {
    const { buttons, button, type } = event as PointerEvent;

    if (
      this.disabled ||
      // Handle pointer or mouse event, and ignore touch event
      (((type === 'pointerdown' &&
        (event as PointerEvent).pointerType === 'mouse') ||
        type === 'mousedown') &&
        // No primary button (Usually the left button)
        ((isNumber(buttons) && buttons !== 1) ||
          (isNumber(button) && button !== 0) ||
          // Open context menu
          (event as PointerEvent).ctrlKey))
    ) {
      return;
    }

    const { $pointers } = this;
    let action = '';

    if ((event as TouchEvent).changedTouches) {
      Array.from((event as TouchEvent).changedTouches).forEach(
        ({ identifier, clientX, clientY }) => {
          const [x, y] = this.viewportTransformBack([clientX, clientY]);
          $pointers.set(identifier, {
            startX: x,
            startY: y,
            endX: x,
            endY: y,
          });
        }
      );
    } else {
      const { pointerId = 0, clientX, clientY } = event as PointerEvent;
      const [x, y] = this.viewportTransformBack([clientX, clientY]);
      $pointers.set(pointerId, {
        startX: x,
        startY: y,
        endX: x,
        endY: y,
      });
    }

    if ($pointers.size > 1) {
      action = ACTION_TRANSFORM;
    } else if (isElement(event.target)) {
      action =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event.target as any).action ||
        event.target.getAttribute(ATTRIBUTE_ACTION) ||
        '';
    }

    if (
      this.$emit(EVENT_ACTION_START, {
        action,
        relatedEvent: event,
      }) === false
    ) {
      return;
    }

    // Prevent page zooming in the browsers for iOS.
    event.preventDefault();
    this.$action = action;
    this.style.willChange = 'transform';
  }

  protected $handlePointerMove(event: Event): void {
    const { $action, $pointers } = this;

    if (this.disabled || $action === ACTION_NONE || $pointers.size === 0) {
      return;
    }

    if (
      this.$emit(EVENT_ACTION_MOVE, {
        action: $action,
        relatedEvent: event,
      }) === false
    ) {
      return;
    }

    // Prevent page scrolling.
    event.preventDefault();

    if ((event as TouchEvent).changedTouches) {
      Array.from((event as TouchEvent).changedTouches).forEach(
        ({ identifier, clientX, clientY }) => {
          const pointer = $pointers.get(identifier);

          if (pointer) {
            const [x, y] = this.viewportTransformBack([clientX, clientY]);
            Object.assign(pointer, {
              endX: x,
              endY: y,
            });
          }
        }
      );
    } else {
      const { pointerId = 0, clientX, clientY } = event as PointerEvent;
      const pointer = $pointers.get(pointerId);

      if (pointer) {
        const [x, y] = this.viewportTransformBack([clientX, clientY]);
        Object.assign(pointer, {
          endX: x,
          endY: y,
        });
      }
    }

    const detail: ActionEventData = {
      action: $action,
      relatedEvent: event,
    };

    if ($action === ACTION_TRANSFORM) {
      const pointers2 = new Map($pointers);
      let maxRotateRate = 0;
      let maxScaleRate = 0;
      let rotate = 0;
      let scale = 0;
      let centerX = (event as PointerEvent).pageX;
      let centerY = (event as PointerEvent).pageY;

      $pointers.forEach((pointer, pointerId) => {
        pointers2.delete(pointerId);
        pointers2.forEach(pointer2 => {
          let x1 = pointer2.startX - pointer.startX;
          let y1 = pointer2.startY - pointer.startY;
          let x2 = pointer2.endX - pointer.endX;
          let y2 = pointer2.endY - pointer.endY;
          let z1 = 0;
          let z2 = 0;
          let a1 = 0;
          let a2 = 0;

          if (x1 === 0) {
            if (y1 < 0) {
              a1 = Math.PI * 2;
            } else if (y1 > 0) {
              a1 = Math.PI;
            }
          } else if (x1 > 0) {
            a1 = Math.PI / 2 + Math.atan(y1 / x1);
          } else if (x1 < 0) {
            a1 = Math.PI * 1.5 + Math.atan(y1 / x1);
          }

          if (x2 === 0) {
            if (y2 < 0) {
              a2 = Math.PI * 2;
            } else if (y2 > 0) {
              a2 = Math.PI;
            }
          } else if (x2 > 0) {
            a2 = Math.PI / 2 + Math.atan(y2 / x2);
          } else if (x2 < 0) {
            a2 = Math.PI * 1.5 + Math.atan(y2 / x2);
          }

          if (a2 > 0 || a1 > 0) {
            const rotateRate = a2 - a1;
            const absRotateRate = Math.abs(rotateRate);

            if (absRotateRate > maxRotateRate) {
              maxRotateRate = absRotateRate;
              rotate = rotateRate;
              centerX = (pointer.startX + pointer2.startX) / 2;
              centerY = (pointer.startY + pointer2.startY) / 2;
            }
          }

          x1 = Math.abs(x1);
          y1 = Math.abs(y1);
          x2 = Math.abs(x2);
          y2 = Math.abs(y2);

          if (x1 > 0 && y1 > 0) {
            z1 = Math.sqrt(x1 * x1 + y1 * y1);
          } else if (x1 > 0) {
            z1 = x1;
          } else if (y1 > 0) {
            z1 = y1;
          }

          if (x2 > 0 && y2 > 0) {
            z2 = Math.sqrt(x2 * x2 + y2 * y2);
          } else if (x2 > 0) {
            z2 = x2;
          } else if (y2 > 0) {
            z2 = y2;
          }

          if (z1 > 0 && z2 > 0) {
            const scaleRate = (z2 - z1) / z1;
            const absScaleRate = Math.abs(scaleRate);

            if (absScaleRate > maxScaleRate) {
              maxScaleRate = absScaleRate;
              scale = scaleRate;
              centerX = (pointer.startX + pointer2.startX) / 2;
              centerY = (pointer.startY + pointer2.startY) / 2;
            }
          }
        });
      });

      const rotatable = maxRotateRate > 0;
      const scalable = maxScaleRate > 0;

      if (rotatable && scalable) {
        detail.rotate = rotate;
        detail.scale = scale;
        detail.centerX = centerX;
        detail.centerY = centerY;
      } else if (rotatable) {
        detail.action = ACTION_ROTATE;
        detail.rotate = rotate;
        detail.centerX = centerX;
        detail.centerY = centerY;
      } else if (scalable) {
        detail.action = ACTION_SCALE;
        detail.scale = scale;
        detail.centerX = centerX;
        detail.centerY = centerY;
      } else {
        detail.action = ACTION_NONE;
      }
    } else {
      const [pointer] = Array.from($pointers.values());

      Object.assign(detail, pointer);
    }

    // Override the starting coordinate
    $pointers.forEach(pointer => {
      pointer.startX = pointer.endX;
      pointer.startY = pointer.endY;
    });

    if (detail.action !== ACTION_NONE) {
      this.$emit(EVENT_ACTION, detail, {
        cancelable: false,
      });
    }
  }

  protected $handlePointerUp(event: Event): void {
    const { $action, $pointers } = this;

    if (this.disabled || $action === ACTION_NONE) {
      return;
    }

    if (
      this.$emit(EVENT_ACTION_END, {
        action: $action,
        relatedEvent: event,
      }) === false
    ) {
      return;
    }

    event.preventDefault();

    if ((event as TouchEvent).changedTouches) {
      Array.from((event as TouchEvent).changedTouches).forEach(
        ({ identifier }) => {
          $pointers.delete(identifier);
        }
      );
    } else {
      const { pointerId = 0 } = event as PointerEvent;

      $pointers.delete(pointerId);
    }

    if ($pointers.size === 0) {
      this.style.willChange = '';
      this.$action = ACTION_NONE;
    }
  }

  protected $handleWheel(event: Event): void {
    if (this.disabled) {
      return;
    }

    event.preventDefault();

    // Limit wheel speed to prevent zoom too fast (#21)
    if (this.$wheeling) {
      return;
    }

    this.$wheeling = true;

    // Debounce by 50ms
    setTimeout(() => {
      this.$wheeling = false;
    }, 50);

    const delta = (event as WheelEvent).deltaY > 0 ? -1 : 1;
    const scale = delta * this.scaleStep;

    this.$emit(
      EVENT_ACTION,
      {
        action: ACTION_SCALE,
        scale,
        relatedEvent: event,
      },
      {
        cancelable: false,
      }
    );
  }

  protected override $propertyChangedCallback(
    name: string,
    oldValue: unknown,
    newValue: unknown
  ): void {
    if (Object.is(newValue, oldValue)) {
      return;
    }

    super.$propertyChangedCallback(name, oldValue, newValue);

    switch (name) {
      case 'disabled':
        if (newValue) {
          this.$unbind();
        } else {
          this.$bind();
        }
        break;

      default:
    }
  }

  /**
   * Changes the current action to a new one.
   * @param {string} action The new action.
   * @returns {CropperCanvas} Returns `this` for chaining.
   */
  $setAction(action: string): this {
    if (isString(action)) {
      this.$action = action;
    }

    return this;
  }

  /**
   * Generates a real canvas element, with the image draw into if there is one.
   * @param {object} [options] The available options.
   * @param {number} [options.width] The width of the canvas.
   * @param {number} [options.height] The height of the canvas.
   * @param {Function} [options.beforeDraw] The function called before drawing the image onto the canvas.
   * @returns {Promise} Returns a promise that resolves to the generated canvas element.
   */
  $toCanvas(options?: {
    width?: number;
    height?: number;
    beforeDraw?: (
      context: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement
    ) => void;
  }): Promise<HTMLCanvasElement> {
    return new Promise<HTMLCanvasElement>((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('The current element is not connected to the DOM.'));
        return;
      }

      const canvas = document.createElement('canvas');
      let width = this.offsetWidth;
      let height = this.offsetHeight;
      let scale = 1;

      if (
        isPlainObject(options) &&
        (isPositiveNumber(options.width) || isPositiveNumber(options.height))
      ) {
        ({ width, height } = getAdjustedSizes({
          aspectRatio: width / height,
          width: options.width as number,
          height: options.height as number,
        }));
        scale = width / this.offsetWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const cropperImage = this.querySelector(
        this.$getTagNameOf(CROPPER_IMAGE)
      ) as CropperImage;

      if (!cropperImage) {
        resolve(canvas);
        return;
      }

      cropperImage
        .$ready()
        .then((image: HTMLImageElement) => {
          const context = canvas.getContext('2d');

          if (context) {
            const [a, b, c, d, e, f] = cropperImage.$getTransform();
            let newE = e;
            let newF = f;
            let destWidth = image.naturalWidth;
            let destHeight = image.naturalHeight;

            if (scale !== 1) {
              newE *= scale;
              newF *= scale;
              destWidth *= scale;
              destHeight *= scale;
            }

            const centerX = destWidth / 2;
            const centerY = destHeight / 2;

            context.fillStyle = 'transparent';
            context.fillRect(0, 0, width, height);

            if (isPlainObject(options) && isFunction(options.beforeDraw)) {
              options.beforeDraw.call(this, context, canvas);
            }

            context.save();

            // Move the transform origin to the center of the image.
            // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin
            context.translate(centerX, centerY);
            context.transform(a, b, c, d, newE, newF);

            // Reset the transform origin to the top-left of the image.
            context.translate(-centerX, -centerY);
            context.drawImage(image, 0, 0, destWidth, destHeight);
            context.restore();
          }

          resolve(canvas);
        })
        .catch(reject);
    });
  }

  protected $unbind(): void {
    if (this.$onPointerDown) {
      off(this, EVENT_POINTER_DOWN, this.$onPointerDown);
      this.$onPointerDown = null;
    }

    if (this.$onPointerMove) {
      off(this.ownerDocument, EVENT_POINTER_MOVE, this.$onPointerMove);
      this.$onPointerMove = null;
    }

    if (this.$onPointerUp) {
      off(this.ownerDocument, EVENT_POINTER_UP, this.$onPointerUp);
      this.$onPointerUp = null;
    }

    if (this.$onWheel) {
      off(this, EVENT_WHEEL, this.$onWheel, {
        capture: true,
      });
      this.$onWheel = null;
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.disabled) {
      this.$bind();
    }
  }

  override disconnectedCallback(): void {
    if (!this.disabled) {
      this.$unbind();
    }

    super.disconnectedCallback();
  }
}
