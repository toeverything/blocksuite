export interface FontConfig {
  font: string;
  weight: string;
  url: string;
}

export class FontLoader {
  readonly fontFaces: FontFace[];

  load: Promise<FontFace[]>;

  constructor(fonts: FontConfig[]) {
    this.fontFaces = fonts.map(({ font, weight, url }) => {
      const fontFace = new FontFace(font, `url(${url})`, {
        weight,
      });
      document.fonts.add(fontFace);
      return fontFace;
    });
    this.load = Promise.all(this.fontFaces.map(fontFace => fontFace.load()));
  }
}
