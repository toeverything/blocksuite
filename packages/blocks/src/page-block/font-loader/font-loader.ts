export interface FontConfig {
  font: string;
  weight: string;
  url: string;
  style: string;
}

export class FontLoader {
  readonly fontFaces: FontFace[] = [];

  get ready() {
    return Promise.all(this.fontFaces.map(fontFace => fontFace.loaded));
  }

  load(fonts: FontConfig[]) {
    this.fontFaces.push(
      ...fonts.map(({ font, weight, url, style }) => {
        const fontFace = new FontFace(font, `url(${url})`, {
          weight,
          style,
        });
        document.fonts.add(fontFace);
        return fontFace;
      })
    );
  }

  clear() {
    this.fontFaces.forEach(fontFace => document.fonts.delete(fontFace));
    this.fontFaces.splice(0, this.fontFaces.length);
  }
}
