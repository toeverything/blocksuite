import { WithDisposable } from '@blocksuite/block-std';
import {
  SignalWatcher,
  batch,
  computed,
  signal,
} from '@lit-labs/preact-signals';
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type {
  Hsva,
  ModeRgba,
  ModeTab,
  ModeType,
  NavTab,
  NavType,
  PickColorEvent,
  Point,
  Rgb,
} from './types.js';

import { on, once, stopPropagation } from '../../../../_common/utils/event.js';
import { AREA_CIRCLE_R, MATCHERS, SLIDER_CIRCLE_R } from './consts.js';
import { COLOR_PICKER_STYLE } from './styles.js';
import {
  bound01,
  clamp,
  defaultHsva,
  eq,
  hsvaToRgba,
  linearGradientAt,
  parseHexToHsva,
  renderCanvas,
  rgbToHex,
  rgbToHsv,
  rgbaToHex8,
  rgbaToHsva,
} from './utils.js';

const TABS: NavTab<NavType>[] = [
  { type: 'colors', name: 'Colors' },
  { type: 'custom', name: 'Custom' },
];

@customElement('edgeless-color-picker')
export class EdgelessColorPicker extends SignalWatcher(
  WithDisposable(LitElement)
) {
  #alphaRect = new DOMRect();

  #editAlpha = (e: InputEvent) => {
    const value = Number((e.target as HTMLInputElement).value.trim());
    const alpha = clamp(0, value, 100);
    const a = bound01(alpha, 100);
    const hsva = this.hsva$.peek();

    if (hsva.a === a) return;

    const x = this.#alphaRect.width * a;
    this.alphaPosX$.value = x;

    this.#pick();
  };

  #editHex = (e: KeyboardEvent) => {
    e.stopPropagation();

    const target = e.target as HTMLInputElement;

    if (e.key === 'Enter') {
      const value = target.value.trim().replace(MATCHERS.other, '');
      let matched;
      if (
        (matched = value.match(MATCHERS.hex3)) ||
        (matched = value.match(MATCHERS.hex6))
      ) {
        const { h, s, v } = parseHexToHsva(matched[1]);
        const hsv = { h, s, v };

        const oldHsva = this.hsva$.peek();

        if (eq(hsv, oldHsva)) return;

        const newHsva = { ...oldHsva, ...hsv };

        this.#setControlsPos(newHsva);

        this.#pick();
      } else {
        target.value = this.hex6WithoutHash;
      }
    }
  };

  #hueRect = new DOMRect();

  #paletteRect = new DOMRect();

  static override styles = COLOR_PICKER_STYLE;

  #pick() {
    const hsva = this.hsva$.peek();
    const type = this.modeType$.peek();
    const rgba = hsvaToRgba(hsva);
    const value = rgbaToHex8(rgba);

    this.pick?.({ type: 'pick', detail: { type, value } });
  }

  #pickEnd() {
    this.pick?.({ type: 'end' });
  }

  #pickStart() {
    this.pick?.({ type: 'start' });
  }

  #setAlphaPos(clientX: number) {
    const { left, width } = this.#alphaRect;
    const x = clamp(0, clientX - left, width);

    this.alphaPosX$.value = x;
  }

  #setAlphaPosWithWheel(y: number) {
    const { width } = this.#alphaRect;
    const px = this.alphaPosX$.peek();
    const ax = clamp(0, px + (y * width) / 100, width);

    this.alphaPosX$.value = ax;
  }

  #setControlsPos({ h, s, v, a }: Hsva) {
    const hx = this.#hueRect.width * h;
    const px = this.#paletteRect.width * s;
    const py = this.#paletteRect.height * (1 - v);
    const ax = this.#alphaRect.width * a;

    batch(() => {
      this.huePosX$.value = hx;
      this.alphaPosX$.value = ax;
      this.palettePos$.value = { x: px, y: py };
    });
  }

  #setHuePos(clientX: number) {
    const { left, width } = this.#hueRect;
    const x = clamp(0, clientX - left, width);

    this.huePosX$.value = x;
  }

  #setHuePosWithWheel(y: number) {
    const { width } = this.#hueRect;
    const px = this.huePosX$.peek();
    const ax = clamp(0, px + (y * width) / 100, width);

    this.huePosX$.value = ax;
  }

  #setPalettePos(clientX: number, clientY: number) {
    const { left, top, width, height } = this.#paletteRect;
    const x = clamp(0, clientX - left, width);
    const y = clamp(0, clientY - top, height);

    this.palettePos$.value = { x, y };
  }

  #setPalettePosWithWheel(x: number, y: number) {
    const { width, height } = this.#paletteRect;
    const pos = this.palettePos$.peek();
    const px = clamp(0, pos.x + (x * width) / 100, width);
    const py = clamp(0, pos.y + (y * height) / 100, height);

    this.palettePos$.value = { x: px, y: py };
  }

  #setRect({ left, top, width, height }: DOMRect, offset: number) {
    return new DOMRect(
      left + offset,
      top + offset,
      Math.round(width - offset * 2),
      Math.round(height - offset * 2)
    );
  }

  #setRects() {
    this.#paletteRect = this.#setRect(
      this.paletteControl.getBoundingClientRect(),
      AREA_CIRCLE_R
    );

    this.#hueRect = this.#setRect(
      this.hueControl.getBoundingClientRect(),
      SLIDER_CIRCLE_R
    );

    this.#alphaRect = this.#setRect(
      this.alphaControl.getBoundingClientRect(),
      SLIDER_CIRCLE_R
    );
  }

  #switchModeTab(type: ModeType) {
    this.modeType$.value = type;
    this.#setControlsPos(this.mode$.peek().hsva);
  }

  #switchNavTab(type: NavType) {
    this.navType$.value = type;

    if (type === 'colors') {
      const mode = this.mode$.peek();
      this.modes$.value[0].hsva = { ...mode.hsva };
      this.modeType$.value = 'normal';
    } else {
      const [normal, light, dark] = this.modes$.value;
      light.hsva = { ...normal.hsva };
      dark.hsva = { ...normal.hsva };
      this.modeType$.value = 'light';
    }
  }

  override firstUpdated() {
    let clicked = false;
    let dragged = false;
    let outed = false;
    let picked = false;

    let pointerenter: (() => void) | null;
    let pointermove: (() => void) | null;
    let pointerout: (() => void) | null;
    let timerId = 0;

    this.disposables.addFromEvent(this, 'wheel', (e: WheelEvent) => {
      e.stopPropagation();

      const target = e.composedPath()[0] as HTMLElement;
      const isInHue = target === this.hueControl;
      const isInAlpha = !isInHue && target === this.alphaControl;
      const isInPalette = !isInAlpha && target === this.paletteControl;
      picked = isInHue || isInAlpha || isInPalette;

      if (timerId) {
        clearTimeout(timerId);
      }

      // update target rect
      if (picked) {
        if (!timerId) {
          this.#pickStart();
        }
        timerId = window.setTimeout(() => {
          this.#pickEnd();
          timerId = 0;
        }, 110);
      }

      const update = (x: number, y: number, scrolled = false) => {
        if (!picked) return;

        x = x === 0 ? 0 : x < 0 ? 1 : -1;
        y = y === 0 ? 0 : y < 0 ? 1 : -1;

        if (isInHue && y !== 0) {
          scrolled = true;
          this.#setHuePosWithWheel(y);
        }

        if (isInAlpha && y !== 0) {
          scrolled = true;
          this.#setAlphaPosWithWheel(y);
        }

        if (isInPalette && (x !== 0 || y !== 0)) {
          scrolled = true;
          this.#setPalettePosWithWheel(x, y);
        }

        if (!scrolled) return;

        this.#pick();
      };

      update(e.deltaX, e.deltaY);
    });

    this.disposables.addFromEvent(this, 'pointerdown', (e: PointerEvent) => {
      e.stopPropagation();

      if (timerId) {
        clearTimeout(timerId);
        timerId = 0;
      }

      // checks pointer enter/out
      pointerenter = on(this, 'pointerenter', () => (outed = false));
      pointerout = on(this, 'pointerout', () => (outed = true));
      // cleanups
      once(document, 'pointerup', () => {
        pointerenter?.();
        pointermove?.();
        pointerout?.();

        if (picked) {
          this.#pickEnd();
        }

        // When dragging the points, the color picker panel should not be triggered to close.
        if (dragged && outed) {
          once(document, 'click', stopPropagation, true);
        }

        pointerenter = pointermove = pointerout = null;
        clicked = dragged = outed = picked = false;
      });

      clicked = true;

      const target = e.composedPath()[0] as HTMLElement;
      const isInHue = target === this.hueControl;
      const isInAlpha = !isInHue && target === this.alphaControl;
      const isInPalette = !isInAlpha && target === this.paletteControl;
      picked = isInHue || isInAlpha || isInPalette;

      // update target rect
      if (picked) {
        this.#pickStart();

        const rect = target.getBoundingClientRect();
        if (isInHue) {
          this.#hueRect = this.#setRect(rect, SLIDER_CIRCLE_R);
        } else if (isInAlpha) {
          this.#alphaRect = this.#setRect(rect, SLIDER_CIRCLE_R);
        } else if (isInPalette) {
          this.#paletteRect = this.#setRect(rect, AREA_CIRCLE_R);
        }
      }

      const update = (x: number, y: number) => {
        if (!picked) return;

        if (isInHue) {
          this.#setHuePos(x);
        }

        if (isInAlpha) {
          this.#setAlphaPos(x);
        }

        if (isInPalette) {
          this.#setPalettePos(x, y);
        }

        this.#pick();
      };

      update(e.x, e.y);

      pointermove = on(document, 'pointermove', (e: PointerEvent) => {
        if (!clicked) return;
        if (!dragged) dragged = true;

        update(e.x, e.y);
      });
    });
    this.disposables.addFromEvent(this, 'click', stopPropagation);

    this.disposables.add(
      this.hsva$.subscribe((hsva: Hsva) => {
        const type = this.modeType$.peek();
        const mode = this.modes$.value.find(mode => mode.type === type);

        if (mode) {
          mode.hsva = { ...hsva };
        }
      })
    );

    this.disposables.add(
      this.huePosX$.subscribe((x: number) => {
        const { width } = this.#hueRect;
        const rgb = linearGradientAt(bound01(x, width));

        // Updates palette canvas
        renderCanvas(this.canvas, rgb);

        this.hue$.value = rgb;
      })
    );

    this.disposables.add(
      this.hue$.subscribe((rgb: Rgb) => {
        const hsva = this.hsva$.peek();

        hsva.h = rgbToHsv(rgb).h;

        this.hsva$.value = { ...hsva };
      })
    );

    this.disposables.add(
      this.alphaPosX$.subscribe((x: number) => {
        const hsva = this.hsva$.peek();
        const { width } = this.#alphaRect;

        hsva.a = bound01(x, width);

        this.hsva$.value = { ...hsva };
      })
    );

    this.disposables.add(
      this.palettePos$.subscribe(({ x, y }: Point) => {
        const hsva = this.hsva$.peek();
        const { width, height } = this.#paletteRect;

        hsva.s = bound01(x, width);
        hsva.v = bound01(height - y, height);

        this.hsva$.value = { ...hsva };
      })
    );

    const batches: (() => void)[] = [];
    const { type, modes } = this.colors;

    // Updates UI states
    if (['dark', 'light'].includes(type)) {
      batches.push(() => {
        this.modeType$.value = type;
        this.navType$.value = 'custom';
      });
    }

    // Updates modes
    if (modes?.length) {
      batches.push(() => {
        this.modes$.value.reduce((fallback, curr, n) => {
          const m = modes[n];
          curr.hsva = m ? rgbaToHsva(m.rgba) : fallback;
          return { ...curr.hsva };
        }, defaultHsva());
      });
    }

    // Updates controls' positions
    batches.push(() => {
      const mode = this.mode$.peek();
      this.#setControlsPos(mode.hsva);
    });

    // Updates controls' rects
    this.#setRects();

    batch(() => batches.forEach(fn => fn()));
  }

  override render() {
    return html`
      <header>
        <nav>
          ${repeat(
            TABS,
            tab => tab.type,
            ({ type, name }) => html`
              <button
                ?active=${type === this.navType$.value}
                @click=${() => this.#switchNavTab(type)}
              >
                ${name}
              </button>
            `
          )}
        </nav>
      </header>

      <div class="modes" ?active=${this.navType$.value === 'custom'}>
        ${repeat(
          [this.light$.value, this.dark$.value],
          mode => mode.type,
          ({ type, name, hsva }) => html`
            <div
              class="${classMap({ mode: true, [type]: true })}"
              style=${styleMap({ '--c': rgbaToHex8(hsvaToRgba(hsva)) })}
            >
              <button
                ?active=${this.modeType$.value === type}
                @click=${() => this.#switchModeTab(type)}
              >
                <div class="color"></div>
                <div>${name}</div>
              </button>
            </div>
          `
        )}
      </div>

      <div class="content">
        <div class="color-palette-wrapper" style=${this.paletteStyle$.value}>
          <canvas></canvas>
          <div class="color-circle"></div>
          <div class="color-palette"></div>
        </div>
        <div class="color-slider-wrapper hue" style=${this.hueStyle$.value}>
          <div class="color-circle"></div>
          <div class="color-slider"></div>
        </div>
        <div class="color-slider-wrapper alpha" style=${this.alphaStyle$.value}>
          <div class="color-circle"></div>
          <div class="color-slider"></div>
        </div>
      </div>

      <footer>
        <label class="field color">
          <span>#</span>
          <input
            autocomplete="off"
            spellcheck="false"
            minlength="1"
            maxlength="6"
            .value=${live(this.hex6WithoutHash)}
            @keydown=${this.#editHex}
          />
        </label>
        <label class="field opacity">
          <input
            type="number"
            min="0"
            max="100"
            .value=${live(this.alpha100)}
            @input=${this.#editAlpha}
          />
          <span>%</span>
        </label>
      </footer>
    `;
  }

  // 0-100
  get alpha100() {
    return `${Math.round(this.hsva$.value.a * 100)}`;
  }

  get hex6WithoutHash() {
    return this.hex6$.value.substring(1);
  }

  @query('.color-slider-wrapper.alpha .color-slider')
  accessor alphaControl!: HTMLDivElement;

  accessor alphaPosX$ = signal<number>(0);

  accessor alphaStyle$ = computed(() => {
    const x = this.alphaPosX$.value;
    const rgba = this.rgba$.value;
    const hex = `#${rgbToHex(rgba)}`;
    return styleMap({
      '--o': rgba.a,
      '--s': `${hex}00`,
      '--c': `${hex}ff`,
      '--x': `${x}px`,
      '--r': `${SLIDER_CIRCLE_R}px`,
    });
  });

  @query('canvas')
  accessor canvas!: HTMLCanvasElement;

  @property({ attribute: false })
  accessor colors: { type: ModeType; modes?: ModeRgba[] } = { type: 'normal' };

  accessor dark$ = computed<ModeTab<ModeType>>(() => this.modes$.value[2]);

  // #ffffff
  accessor hex6$ = computed(() => this.hex8$.value.substring(0, 7));

  // #ffffffff
  accessor hex8$ = computed(() => rgbaToHex8(this.rgba$.value));

  accessor hsva$ = signal<Hsva>(defaultHsva());

  accessor hue$ = signal<Rgb>({ r: 0, g: 0, b: 0 });

  @query('.color-slider-wrapper.hue .color-slider')
  accessor hueControl!: HTMLDivElement;

  accessor huePosX$ = signal<number>(0);

  accessor hueStyle$ = computed(() => {
    const x = this.huePosX$.value;
    const rgb = this.hue$.value;
    return styleMap({
      '--x': `${x}px`,
      '--c': `#${rgbToHex(rgb)}`,
      '--r': `${SLIDER_CIRCLE_R}px`,
    });
  });

  accessor light$ = computed<ModeTab<ModeType>>(() => this.modes$.value[1]);

  accessor mode$ = computed<ModeTab<ModeType>>(() => {
    const modeType = this.modeType$.value;
    return this.modes$.value.find(mode => mode.type === modeType)!;
  });

  accessor modeType$ = signal<ModeType>('normal');

  accessor modes$ = signal<ModeTab<ModeType>[]>([
    { type: 'normal', name: 'Normal', hsva: defaultHsva() },
    { type: 'light', name: 'Light', hsva: defaultHsva() },
    { type: 'dark', name: 'Dark', hsva: defaultHsva() },
  ]);

  accessor navType$ = signal<NavType>('colors');

  @query('.color-palette')
  accessor paletteControl!: HTMLDivElement;

  accessor palettePos$ = signal<Point>({ x: 0, y: 0 });

  accessor paletteStyle$ = computed(() => {
    const { x, y } = this.palettePos$.value;
    const c = this.hex6$.value;
    return styleMap({
      '--c': c,
      '--x': `${x}px`,
      '--y': `${y}px`,
      '--r': `${AREA_CIRCLE_R}px`,
    });
  });

  @property({ attribute: false })
  accessor pick!: (event: PickColorEvent) => void;

  accessor rgba$ = computed(() => hsvaToRgba(this.hsva$.value));
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-color-picker': EdgelessColorPicker;
  }
}
