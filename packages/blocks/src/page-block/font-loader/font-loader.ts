export interface FontConfig {
  font: string;
  weight: string;
  url: string;
  style: string;
}

export class FontLoader {
  readonly fontFaces: FontFace[];

  load: Promise<FontFace[]>;

  constructor(fonts: FontConfig[]) {
    this.fontFaces = fonts.map(({ font, weight, url, style }) => {
      const fontFace = new FontFace(font, `url(${url})`, {
        weight,
        style,
      });
      document.fonts.add(fontFace);
      return fontFace;
    });
    this.load = Promise.all(this.fontFaces.map(fontFace => fontFace.load()));
  }
}
