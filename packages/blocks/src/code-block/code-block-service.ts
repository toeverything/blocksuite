import {
  type AffineTextAttributes,
  InlineManager,
} from '@blocksuite/affine-components/rich-text';
import { type CodeBlockModel, ColorScheme } from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { BlockService } from '@blocksuite/block-std';
import { type Signal, signal } from '@lit-labs/preact-signals';
import {
  type HighlighterCore,
  type MaybeGetter,
  createHighlighterCore,
} from 'shiki';
import getWasm from 'shiki/wasm';

import { codeBlockInlineSpecs } from './highlight/code-block-inline-specs.js';
import {
  CODE_BLOCK_DEFAULT_DARK_THEME,
  CODE_BLOCK_DEFAULT_LIGHT_THEME,
} from './highlight/const.js';

export class CodeBlockService<
  TextAttributes extends AffineTextAttributes = AffineTextAttributes,
> extends BlockService<CodeBlockModel> {
  private _darkThemeKey: string | undefined;

  private _lightThemeKey: string | undefined;

  highlighter$: Signal<HighlighterCore | null> = signal(null);

  readonly inlineManager = new InlineManager<TextAttributes>();

  override mounted(): void {
    super.mounted();

    this.inlineManager.registerSpecs(codeBlockInlineSpecs);

    createHighlighterCore({
      loadWasm: getWasm,
    })
      .then(async highlighter => {
        const config = this.std.spec.getConfig('affine:code');
        const darkTheme = config?.theme.dark ?? CODE_BLOCK_DEFAULT_DARK_THEME;
        const lightTheme =
          config?.theme.light ?? CODE_BLOCK_DEFAULT_LIGHT_THEME;

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

  get themeKey() {
    return ThemeObserver.instance.mode$.value === ColorScheme.Dark
      ? this._darkThemeKey
      : this._lightThemeKey;
  }
}

/**
 * https://github.com/shikijs/shiki/blob/933415cdc154fe74ccfb6bbb3eb6a7b7bf183e60/packages/core/src/internal.ts#L31
 */
export async function normalizeGetter<T>(p: MaybeGetter<T>): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Promise.resolve(typeof p === 'function' ? (p as any)() : p).then(
    r => r.default || r
  );
}
