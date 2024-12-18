import { type Color, ColorScheme } from '@blocksuite/affine-model';
import {
  type BlockStdScope,
  Extension,
  type ExtensionType,
  StdIdentifier,
} from '@blocksuite/block-std';
import { type Container, createIdentifier } from '@blocksuite/global/di';
import { signal, type Signal } from '@preact/signals-core';
import {
  type AffineCssVariables,
  combinedDarkCssVariables,
  combinedLightCssVariables,
} from '@toeverything/theme';
import { unsafeCSS } from 'lit';

import { isInsideEdgelessEditor } from '../utils/index.js';

const TRANSPARENT = 'transparent';

export const ThemeExtensionIdentifier = createIdentifier<ThemeExtension>(
  'AffineThemeExtension'
);

export interface ThemeExtension {
  getAppTheme?: () => Signal<ColorScheme>;
  getEdgelessTheme?: (docId?: string) => Signal<ColorScheme>;
}

export function OverrideThemeExtension(service: ThemeExtension): ExtensionType {
  return {
    setup: di => {
      di.override(ThemeExtensionIdentifier, () => service);
    },
  };
}

export const ThemeProvider = createIdentifier<ThemeService>(
  'AffineThemeProvider'
);

export class ThemeService extends Extension {
  app$: Signal<ColorScheme>;

  edgeless$: Signal<ColorScheme>;

  get appTheme() {
    return this.app$.peek();
  }

  get edgelessTheme() {
    return this.edgeless$.peek();
  }

  get theme() {
    return isInsideEdgelessEditor(this.std.host)
      ? this.edgelessTheme
      : this.appTheme;
  }

  get theme$() {
    return isInsideEdgelessEditor(this.std.host) ? this.edgeless$ : this.app$;
  }

  constructor(private std: BlockStdScope) {
    super();
    const extension = this.std.getOptional(ThemeExtensionIdentifier);
    this.app$ = extension?.getAppTheme?.() || getThemeObserver().theme$;
    this.edgeless$ =
      extension?.getEdgelessTheme?.(this.std.doc.id) ||
      getThemeObserver().theme$;
  }

  static override setup(di: Container) {
    di.addImpl(ThemeProvider, ThemeService, [StdIdentifier]);
  }

  /**
   * Generates a CSS's color property with `var` or `light-dark` functions.
   *
   * Sometimes used to set the frame/note background.
   *
   * @param color - A color value.
   * @param fallback  - If color value processing fails, it will be used as a fallback.
   * @returns - A color property string.
   *
   * @example
   *
   * ```
   * `rgba(255,0,0)`
   * `#fff`
   * `light-dark(#fff, #000)`
   * `var(--affine-palette-shape-blue)`
   * ```
   */
  generateColorProperty(
    color: Color,
    fallback = 'transparent',
    theme = this.theme
  ) {
    let result: string | undefined = undefined;

    if (typeof color === 'object') {
      result = color[theme] ?? color.normal;
    } else {
      result = color;
    }
    if (!result) {
      result = fallback;
    }
    if (result.startsWith('--')) {
      return result.endsWith(TRANSPARENT) ? TRANSPARENT : `var(${result})`;
    }

    return result ?? TRANSPARENT;
  }

  /**
   * Gets a color with the current theme.
   *
   * @param color - A color value.
   * @param fallback - If color value processing fails, it will be used as a fallback.
   * @param real - If true, it returns the computed style.
   * @returns - A color property string.
   *
   * @example
   *
   * ```
   * `rgba(255,0,0)`
   * `#fff`
   * `--affine-palette-shape-blue`
   * ```
   */
  getColorValue(
    color: Color,
    fallback = TRANSPARENT,
    real = false,
    theme = this.theme
  ) {
    let result: string | undefined = undefined;

    if (typeof color === 'object') {
      result = color[theme] ?? color.normal;
    } else {
      result = color;
    }
    if (!result) {
      result = fallback;
    }
    if (real && result.startsWith('--')) {
      result = result.endsWith(TRANSPARENT)
        ? TRANSPARENT
        : this.getCssVariableColor(result, theme);
    }

    return result ?? TRANSPARENT;
  }

  getCssVariableColor(property: string, theme = this.theme) {
    if (property.startsWith('--')) {
      if (property.endsWith(TRANSPARENT)) {
        return TRANSPARENT;
      }
      const key = property as keyof AffineCssVariables;
      const color =
        theme === ColorScheme.Dark
          ? combinedDarkCssVariables[key]
          : combinedLightCssVariables[key];
      return color;
    }
    return property;
  }
}

export class ThemeObserver {
  private observer: MutationObserver;

  theme$ = signal(ColorScheme.Light);

  constructor() {
    const COLOR_SCHEMES: string[] = Object.values(ColorScheme);
    this.observer = new MutationObserver(() => {
      const mode = document.documentElement.dataset.theme;
      if (!mode) return;
      if (!COLOR_SCHEMES.includes(mode)) return;
      if (mode === this.theme$.value) return;

      this.theme$.value = mode as ColorScheme;
    });
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  destroy() {
    this.observer.disconnect();
  }
}

export const getThemeObserver = (function () {
  let observer: ThemeObserver;
  return function () {
    if (observer) return observer;
    observer = new ThemeObserver();
    return observer;
  };
})();

const toolbarColorKeys: Array<keyof AffineCssVariables> = [
  '--affine-background-overlay-panel-color',
  '--affine-v2-layer-background-overlayPanel' as never,
  '--affine-background-error-color',
  '--affine-background-primary-color',
  '--affine-background-tertiary-color',
  '--affine-icon-color',
  '--affine-icon-secondary',
  '--affine-border-color',
  '--affine-divider-color',
  '--affine-text-primary-color',
  '--affine-hover-color',
  '--affine-hover-color-filled',
];

export const lightToolbarStyles = toolbarColorKeys.map(
  key => `${key}: ${unsafeCSS(combinedLightCssVariables[key])};`
);

export const darkToolbarStyles = toolbarColorKeys.map(
  key => `${key}: ${unsafeCSS(combinedDarkCssVariables[key])};`
);
