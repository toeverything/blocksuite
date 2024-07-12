import { IS_FIREFOX } from '@blocksuite/global/env';

export interface FontConfig {
  font: string;
  weight: string;
  url: string;
  style: string;
}

const initFontFace = IS_FIREFOX
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

export class FontLoader {
  readonly fontFaces: FontFace[] = [];

  clear() {
    this.fontFaces.forEach(fontFace => document.fonts.delete(fontFace));
    this.fontFaces.splice(0, this.fontFaces.length);
  }

  load(fonts: FontConfig[]) {
    this.fontFaces.push(
      ...fonts.map(font => {
        const fontFace = initFontFace(font);
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
