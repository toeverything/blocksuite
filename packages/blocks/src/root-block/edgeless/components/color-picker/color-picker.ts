import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, type PropertyValues, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { on, once, stopPropagation } from '../../../../_common/utils/event.js';
import { COLOR_PICKER_STYLE } from './styles.js';
import {
  AREA_CIRCLE_R,
  FIRST_COLOR,
  type Hsv,
  LINEAR_GRADIENT,
  MATCKERS,
  type Rgb,
  SLIDER_CIRCLE_R,
  bound,
  bound01,
  clamp,
  hsvToRgb,
  linearGradientAt,
  rgbToHex,
  rgbToHsv,
  rgbaToHex8,
} from './utils.js';

type NavType = 'colors' | 'custom';

type ModeType = 'light' | 'dark';

type NavTab<Type> = {
  type: Type;
  name: string;
  actived: boolean;
};

type ModeTab<Type> = {
  type: Type;
  name: string;
} & {
  color: Rgb;
  // [0, 100]
  alpha: number;
};

@customElement('edgeless-color-picker')
export class EdgelessColorPicker extends WithDisposable(LitElement) {
  #areaRect = new DOMRect();

  #sliderRect = new DOMRect();

  static override styles = COLOR_PICKER_STYLE;

  #updateArea(clientX: number, clientY: number) {
    const { left, top, width, height } = this.#areaRect;
    const x = clamp(0, clientX - left, width);
    const y = clamp(0, clientY - top, height);

    this.areaOffset = { x, y };
  }

  #updatePositions({ h, s, v }: Hsv) {
    this.sliderOffset = {
      x: this.#sliderRect.width * bound01(h, 360),
      y: 0,
    };

    this.areaOffset = {
      x: this.#areaRect.width * bound01(s, 100),
      y: this.#areaRect.height * bound01(100 - v, 100),
    };
  }

  #updateRect(rect: DOMRect, offset: number) {
    return new DOMRect(
      rect.left + offset,
      rect.top + offset,
      Math.round(rect.width - offset * 2),
      Math.round(rect.height - offset * 2)
    );
  }

  #updateRects() {
    const ar = this.area.getBoundingClientRect();
    this.#areaRect = this.#updateRect(ar, AREA_CIRCLE_R);

    const sr = this.slider.getBoundingClientRect();
    this.#sliderRect = this.#updateRect(sr, SLIDER_CIRCLE_R);
  }

  #updateSlider(clientX: number) {
    const { left, width } = this.#sliderRect;
    const x = clamp(0, clientX - left, width);

    this.sliderOffset = { x, y: 0 };
  }

  override firstUpdated() {
    let clicked = false;
    let dragged = false;
    let outed = false;

    let moved: (() => void) | null;

    this.disposables.addFromEvent(this, 'pointerdown', (e: PointerEvent) => {
      e.stopPropagation();

      // checks pointer position
      this.disposables.add(
        once(this, 'pointerout', (e: PointerEvent) => {
          e.stopPropagation();
          outed = true;
        })
      );
      // cleanups
      this.disposables.add(
        once(document, 'pointerup', (_: PointerEvent) => {
          moved?.();

          // When dragging the points, the color picker panel should not be triggered to close.
          if (dragged && outed) {
            once(document, 'click', stopPropagation, true);
          }

          moved = null;
          clicked = dragged = outed = false;
        })
      );

      clicked = true;

      const target = e.composedPath()[0] as HTMLElement;
      const isInArea = target === this.area;
      const isInSlider = !isInArea && target === this.slider;

      // update target rect
      if (isInArea || isInSlider) {
        const rect = target.getBoundingClientRect();
        if (isInArea) {
          this.#areaRect = this.#updateRect(rect, AREA_CIRCLE_R);
        } else {
          this.#sliderRect = this.#updateRect(rect, SLIDER_CIRCLE_R);
        }
      }

      const update = (x: number, y: number) => {
        if (!isInArea && !isInSlider) return;

        if (isInArea) {
          this.#updateArea(x, y);
        } else {
          this.#updateSlider(x);
        }
      };

      update(e.x, e.y);

      moved = on(document, 'pointermove', (e: PointerEvent) => {
        if (!clicked) return;
        if (!dragged) dragged = true;

        update(e.x, e.y);
      });
    });
    this.disposables.addFromEvent(this, 'click', stopPropagation);

    this.#updateRects();
  }

  override render() {
    const activedCustom = this.navType === 'custom';
    const tabs: NavTab<NavType>[] = [
      {
        type: 'colors',
        name: 'Colors',
        actived: !activedCustom,
      },
      {
        type: 'custom',
        name: 'Custom',
        actived: activedCustom,
      },
    ];

    return html`
      <header>
        <nav>
          ${repeat(
            tabs,
            tab => tab.type,
            ({ type, name, actived }) => html`
              <button ?actived=${actived} @click=${() => (this.navType = type)}>
                ${name}
              </button>
            `
          )}
        </nav>
      </header>

      <div class="modes" ?actived=${activedCustom}>
        ${repeat(
          this.modes,
          mode => mode.type,
          ({ type, name, color, alpha }) => html`
            <div
              class="${classMap({ mode: true, [type]: true })}"
              style=${styleMap({
                '--c': `#${rgbaToHex8(color, bound01(alpha, 100))}`,
              })}
            >
              <button
                ?actived=${this.modeType === type}
                @click=${() => (this.modeType = type)}
              >
                <div class="color"></div>
                <div>${name}</div>
              </button>
            </div>
          `
        )}
      </div>

      <div class="content">
        <div
          class="color-area-wrapper"
          style=${styleMap({
            '--r': `${AREA_CIRCLE_R}px`,
            '--x': `${this.areaOffset.x}px`,
            '--y': `${this.areaOffset.y}px`,
            '--o': bound01(this.alpha, 100),
            '--bg': this.areaColorToHex,
            '--c': `#${rgbaToHex8(this.color)}`,
          })}
        >
          <div class="color-circle"></div>
          <div class="color-area"></div>
        </div>
        <div
          class="color-slider-wrapper"
          style=${styleMap({
            '--colors': LINEAR_GRADIENT,
            '--r': `${SLIDER_CIRCLE_R}px`,
            '--x': `${this.sliderOffset.x}px`,
            '--c': this.sliderColorToHex,
          })}
        >
          <div class="color-circle"></div>
          <div class="color-slider"></div>
        </div>
      </div>

      <footer>
        <label class="field color">
          <span>#</span>
          <input
            autocomplete="false"
            spellcheck="false"
            minlength="1"
            maxlength="6"
            .value=${live(this.hexString)}
            @keydown=${(e: KeyboardEvent) => {
              e.stopPropagation();
              const target = e.target as HTMLInputElement;
              if (e.key === 'Enter') {
                const value = target.value.trim();
                let matches;
                if (
                  (matches = MATCKERS.hex3.exec(value)) ||
                  (matches = MATCKERS.hex6.exec(value))
                ) {
                  const [_, rc, gc, bc] = matches;
                  const count = rc.length === 1 ? 2 : 1;
                  const r = parseInt(rc.repeat(count), 16);
                  const g = parseInt(gc.repeat(count), 16);
                  const b = parseInt(bc.repeat(count), 16);
                  this.color = { r, g, b };
                  console.log(this.color);
                } else {
                  target.value = this.hexString;
                }
              }
            }}
          />
        </label>
        <label class="field opacity">
          <input
            type="number"
            min="0"
            max="100"
            .value=${live(this.alpha)}
            @input=${(e: InputEvent) => {
              const value = Number((e.target as HTMLInputElement).value.trim());
              const alpha = clamp(0, value, 100);
              this.alpha = alpha;
              this.requestUpdate();
            }}
          />
          <span>%</span>
        </label>
      </footer>
    `;
  }

  override shouldUpdate(changedProperties: PropertyValues) {
    // When switching modes, update the positions of two points
    if (!changedProperties.has('color') && changedProperties.has('modeType')) {
      const mode = this.modes.find(mode => mode.type === this.modeType)!;
      const hsv = rgbToHsv(mode.color);

      this.alpha = mode.alpha;
      this.#updatePositions(hsv);

      return true;
    }
    return super.shouldUpdate(changedProperties);
  }

  override willUpdate(changedProperties: PropertyValues) {
    // Updates the positions of two points after the first update
    if (changedProperties.has('color')) {
      const update = this.hasUpdated ? Promise.resolve() : this.updateComplete;
      update
        .then(() => {
          const hsv = rgbToHsv(this.color);

          // console.log(hsv, this.color);

          // if (this.navType === 'custom') {
          //   const mode = this.modes.find(mode => mode.type === this.modeType)!;
          //   mode.color = this.color;

          //   this.alpha = mode.alpha;
          //   // hsv = rgbToHsv(mode.color);
          // }

          this.#updatePositions(hsv);
        })
        .catch(console.error);

      return;
    }

    // Updates color

    let picked = false;
    const hasAreaOffset = changedProperties.has('areaOffset');
    const hasSliderOffset = changedProperties.has('sliderOffset');
    const hasAlpha = changedProperties.has('alpha');

    if (hasAreaOffset || hasSliderOffset) {
      const hsv = rgbToHsv(this.color);

      // Updates `h`
      if (hasSliderOffset) {
        const { width } = this.#sliderRect;
        const { x } = this.sliderOffset;
        const { h } = rgbToHsv(linearGradientAt(bound01(x, width)));

        hsv.h = h;
      }

      // Updates `s` and `v`
      if (hasAreaOffset) {
        const { width, height } = this.#areaRect;
        const { x, y } = this.areaOffset;

        hsv.s = bound(x, width);
        hsv.v = bound(height - y, height);
      }

      this.color = hsvToRgb(hsv);

      picked = true;
    }

    if (hasAlpha) {
      picked = true;
    }

    const isCustom = this.navType === 'custom';
    const hasNavType = changedProperties.has('navType');

    if (isCustom) {
      // Picks color & alpha
      if (picked) {
        const mode = this.modes.find(mode => mode.type === this.modeType)!;
        mode.color = { ...this.color };
        mode.alpha = this.alpha;
        return;
      }

      // Updates the colors of both modes after switching to `custom`
      if (hasNavType) {
        for (const mode of this.modes) {
          mode.color = { ...this.color };
          mode.alpha = this.alpha;
        }
      }
    }
  }

  get areaColorToHex() {
    return `#${rgbToHex(
      hsvToRgb({
        ...rgbToHsv(this.color),
        s: 100,
        v: 100,
      })
    )}`;
  }

  get hexString() {
    return rgbToHex(this.color);
  }

  get sliderColorToHex() {
    const { width } = this.#sliderRect;
    const { x } = this.sliderOffset;
    const hsv = rgbToHsv(linearGradientAt(bound01(x, width)));
    return `#${rgbToHex(hsvToRgb(hsv))} `;
  }

  // Alpha: [0, 100]
  @state()
  accessor alpha = 100;

  @query('.color-area')
  accessor area!: HTMLDivElement;

  @state()
  accessor areaOffset = { x: 0, y: 0 };

  @property({ type: Object, state: true })
  accessor color: Rgb = FIRST_COLOR;

  // HSV, fallback to `COLORS[0][0]`.
  @state()
  accessor modeType: ModeType = 'light';

  @state()
  accessor modes: ModeTab<ModeType>[] = [
    {
      type: 'light',
      name: 'Light',
      color: {
        ...this.color,
      },
      alpha: 100,
    },
    {
      type: 'dark',
      name: 'Dark',
      color: {
        ...this.color,
      },
      alpha: 100,
    },
  ];

  @property()
  accessor navType: NavType = 'colors';

  @query('.color-slider')
  accessor slider!: HTMLDivElement;

  @state()
  accessor sliderOffset = { x: 0, y: 0 };
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-color-picker': EdgelessColorPicker;
  }
}
