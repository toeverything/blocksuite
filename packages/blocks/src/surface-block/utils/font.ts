import { IS_FIREFOX } from '@blocksuite/global/env';

import type { CanvasTextFontFamily } from '../consts.js';
import type { FontFamily } from '../element-model/common.js';

export function wrapFontFamily(
  fontFamily: CanvasTextFontFamily | string
): string {
  return `"${fontFamily}"`;
}

export const getFontFaces = IS_FIREFOX
  ? () => {
      const keys = document.fonts.keys();
      const fonts = [];
      let done = false;
      while (!done) {
        const item = keys.next();
        done = !!item.done;
        if (item.value) {
          fonts.push(item.value);
        }
      }
      return fonts;
    }
  : () => [...document.fonts.keys()];

export const isSameFontFamily = IS_FIREFOX
  ? (fontFamily: CanvasTextFontFamily | FontFamily | string) =>
      (fontFace: FontFace) =>
        fontFace.family === `"${fontFamily}"`
  : (fontFamily: CanvasTextFontFamily | FontFamily | string) =>
      (fontFace: FontFace) =>
        fontFace.family === fontFamily;

export function getFontFacesByFontFamily(
  fontFamily: CanvasTextFontFamily | FontFamily | string
): FontFace[] {
  return (
    getFontFaces()
      .filter(isSameFontFamily(fontFamily))
      // remove duplicate font faces
      .filter(
        (item, index, arr) =>
          arr.findIndex(
            fontFace =>
              fontFace.family === item.family &&
              fontFace.weight === item.weight &&
              fontFace.style === item.style
          ) === index
      )
  );
}
