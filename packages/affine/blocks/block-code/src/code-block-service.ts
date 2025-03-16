import { CodeBlockSchema, ColorScheme } from '@blocksuite/affine-model';
import { textKeymap } from '@blocksuite/affine-rich-text';
import { ThemeProvider } from '@blocksuite/affine-shared/services';
import { BlockService } from '@blocksuite/block-std';
import { type Signal, signal } from '@preact/signals-core';
import {
  bundledLanguagesInfo,
  createHighlighterCore,
  createOnigurumaEngine,
  type HighlighterCore,
  type MaybeGetter,
} from 'shiki';
import getWasm from 'shiki/wasm';

import { CodeBlockConfigExtension } from './code-block-config.js';
import {
  CODE_BLOCK_DEFAULT_DARK_THEME,
  CODE_BLOCK_DEFAULT_LIGHT_THEME,
} from './highlight/const.js';

export class CodeBlockService extends BlockService {
  static override readonly flavour = CodeBlockSchema.model.flavour;

  private _darkThemeKey: string | undefined;

  private _lightThemeKey: string | undefined;

  highlighter$: Signal<HighlighterCore | null> = signal(null);

  get langs() {
    return (
      this.std.getOptional(CodeBlockConfigExtension.identifier)?.langs ??
      bundledLanguagesInfo
    );
  }

  get themeKey() {
    const theme = this.std.get(ThemeProvider).theme$.value;
    return theme === ColorScheme.Dark
      ? this._darkThemeKey
      : this._lightThemeKey;
  }

  override mounted(): void {
    super.mounted();

    this.bindHotKey(textKeymap(this.std));

    createHighlighterCore({
      engine: createOnigurumaEngine(() => getWasm),
    })
      .then(async highlighter => {
        const config = this.std.getOptional(
          CodeBlockConfigExtension.identifier
        );
        const darkTheme = config?.theme?.dark ?? CODE_BLOCK_DEFAULT_DARK_THEME;
        const lightTheme =
          config?.theme?.light ?? CODE_BLOCK_DEFAULT_LIGHT_THEME;

        this._darkThemeKey = (await normalizeGetter(darkTheme)).name;
        this._lightThemeKey = (await normalizeGetter(lightTheme)).name;

        await highlighter.loadTheme(darkTheme, lightTheme);

        this.highlighter$.value = highlighter;

        this.disposables.add(() => {
          highlighter.dispose();
        });
      })
      .catch(console.error);
  }
}

/**
 * https://github.com/shikijs/shiki/blob/933415cdc154fe74ccfb6bbb3eb6a7b7bf183e60/packages/core/src/internal.ts#L31
 */
export async function normalizeGetter<T>(p: MaybeGetter<T>): Promise<T> {
  return Promise.resolve(typeof p === 'function' ? (p as any)() : p).then(
    r => r.default || r
  );
}
