import { Slot } from '@blocksuite/global/utils';
import WebfontLoader from 'webfontloader';

export class FontLoader {
  slots: {
    loaded: Slot<string>;
  } = {
    loaded: new Slot<string>(),
  };

  /**
   * use to detect font loading status.
   * @param fonts the font you want to detect, see https://github.com/typekit/webfontloader#custom for more detail
   */
  load(fonts: string[]) {
    WebfontLoader.load({
      custom: {
        families: fonts,
      },
      active: () => {
        fonts.forEach(font => this.slots.loaded.emit(font));
      },
    });
  }
}
