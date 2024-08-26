export enum ColorScheme {
  Dark = 'dark',
  Light = 'light',
}

export type Color = string | { [K in ColorScheme | 'normal']?: string };

export enum TextAlign {
  Center = 'center',
  Left = 'left',
  Right = 'right',
}

export enum TextVerticalAlign {
  Bottom = 'bottom',
  Center = 'center',
  Top = 'top',
}

export type TextStyleProps = {
  color: Color;
  fontFamily: FontFamily;
  fontSize: number;
  fontStyle: FontStyle;
  fontWeight: FontWeight;
  textAlign: TextAlign;
};

export enum FontWeight {
  Bold = '700',
  Light = '300',
  Medium = '500',
  Regular = '400',
  SemiBold = '600',
}

export enum FontStyle {
  Italic = 'italic',
  Normal = 'normal',
}

export enum FontFamily {
  BebasNeue = 'blocksuite:surface:BebasNeue',
  Inter = 'blocksuite:surface:Inter',
  Kalam = 'blocksuite:surface:Kalam',
  Lora = 'blocksuite:surface:Lora',
  OrelegaOne = 'blocksuite:surface:OrelegaOne',
  Poppins = 'blocksuite:surface:Poppins',
  Satoshi = 'blocksuite:surface:Satoshi',
}

export const FontFamilyMap = {
  [FontFamily.Inter]: 'Inter',
  [FontFamily.Kalam]: 'Kalam',
  [FontFamily.Satoshi]: 'Satoshi',
  [FontFamily.Poppins]: 'Poppins',
  [FontFamily.Lora]: 'Lora',
  [FontFamily.BebasNeue]: 'Bebas Neue',
  [FontFamily.OrelegaOne]: 'Orelega One',
} as const satisfies Record<FontFamily, string>;

export const FontFamilyList = Object.entries(FontFamilyMap) as {
  [K in FontFamily]: [K, (typeof FontFamilyMap)[K]];
}[FontFamily][];

export enum TextResizing {
  AUTO_WIDTH,
  AUTO_HEIGHT,
}
