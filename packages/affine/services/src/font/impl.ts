import { IS_FIREFOX } from '@blocksuite/global/env';
import { injectable } from 'inversify';

import type { FontConfig, FontService } from './interface.js';

import { CommunityCanvasTextFonts } from './consts.js';

@injectable()
export class FontServiceImpl implements FontService {
  private _initFontFace = IS_FIREFOX
    ? ({ font, weight, url, style }: FontConfig) =>
        new FontFace(`"${font}"`, `url(${url})`, {
          weight,
          style,
        })
    : ({ font, weight, url, style }: FontConfig) =>
        new FontFace(font, `url(${url})`, {
          weight,
          style,
        });

  readonly fontFaces: FontFace[] = [];

  constructor() {
    this.load(CommunityCanvasTextFonts);
  }

  clear() {
    this.fontFaces.forEach(fontFace => document.fonts.delete(fontFace));
    this.fontFaces.splice(0, this.fontFaces.length);
  }

  load(fonts: FontConfig[]) {
    this.fontFaces.push(
      ...fonts.map(font => {
        const fontFace = this._initFontFace(font);
        document.fonts.add(fontFace);
        fontFace.load().catch(console.error);
        return fontFace;
      })
    );
  }

  get ready() {
    return Promise.all(this.fontFaces.map(fontFace => fontFace.loaded));
  }
}
