import type { FontConfig } from '../root-block/font-loader/font-loader.js';

export const ZOOM_MAX = 6.0;
export const ZOOM_MIN = 0.1;
export const ZOOM_STEP = 0.25;
export const ZOOM_INITIAL = 1.0;
export const GRID_SIZE = 3000;
export const GRID_GAP_MIN = 10;
export const GRID_GAP_MAX = 50;

export const DEFAULT_ROUGHNESS = 1.4;
// TODO: need to check the default central area ratio
export const DEFAULT_CENTRAL_AREA_RATIO = 0.3;

export interface IBound {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
}

export enum ShapeStyle {
  General = 'General',
  Scribbled = 'Scribbled',
}

export enum StrokeStyle {
  Solid = 'solid',
  Dashed = 'dash',
  None = 'none',
}

export interface IModelCoord {
  x: number;
  y: number;
}

export const CanvasTextFontFamily = {
  Inter: 'blocksuite:surface:Inter',
  Kalam: 'blocksuite:surface:Kalam',
  Satoshi: 'blocksuite:surface:Satoshi',
  Poppins: 'blocksuite:surface:Poppins',
  Lora: 'blocksuite:surface:Lora',
  BebasNeue: 'blocksuite:surface:BebasNeue',
  OrelegaOne: 'blocksuite:surface:OrelegaOne',
} as const;
export type CanvasTextFontFamilyKeyType = keyof typeof CanvasTextFontFamily;
export type CanvasTextFontFamilyValueType =
  (typeof CanvasTextFontFamily)[CanvasTextFontFamilyKeyType];

export const CanvasTextFontFamilyKey: CanvasTextFontFamilyKeyType[] =
  Object.keys(CanvasTextFontFamily) as CanvasTextFontFamilyKeyType[];
export const CanvasTextFontFamilyValue: CanvasTextFontFamilyValueType[] =
  Object.values(CanvasTextFontFamily);

export const CanvasTextFontFamilyName = {
  Inter: 'Inter',
  Kalam: 'Kalam',
  Satoshi: 'Satoshi',
  Poppins: 'Poppins',
  Lora: 'Lora',
  BebasNeue: 'Bebas Neue',
  OrelegaOne: 'Orelega One',
} as const satisfies Record<CanvasTextFontFamilyKeyType, string>;

export enum CanvasTextFontWeight {
  Light = '300',
  Regular = '400',
  SemiBold = '600',
}

export enum CanvasTextFontStyle {
  Normal = 'normal',
  Italic = 'italic',
}

export const AffineCanvasTextFonts: FontConfig[] = [
  // Inter, https://fonts.cdnfonts.com/css/inter?styles=29139,29134,29135,29136,29140,29141
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://cdn.affine.pro/fonts/Inter-Light-BETA.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://cdn.affine.pro/fonts/Inter-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://cdn.affine.pro/fonts/Inter-SemiBold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://cdn.affine.pro/fonts/Inter-LightItalic-BETA.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://cdn.affine.pro/fonts/Inter-Italic.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://cdn.affine.pro/fonts/Inter-SemiBoldItalic.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Italic,
  },
  // Kalam, https://fonts.cdnfonts.com/css/kalam?styles=15166,170689,170687
  {
    font: CanvasTextFontFamily.Kalam,
    url: 'https://cdn.affine.pro/fonts/Kalam-Light.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Kalam,
    url: 'https://cdn.affine.pro/fonts/Kalam-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Kalam,
    url: 'https://cdn.affine.pro/fonts/Kalam-Bold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  // Satoshi, https://fonts.cdnfonts.com/css/satoshi?styles=135009,135004,135005,135006,135002,135003
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://cdn.affine.pro/fonts/Satoshi-Light.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://cdn.affine.pro/fonts/Satoshi-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://cdn.affine.pro/fonts/Satoshi-Bold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://cdn.affine.pro/fonts/Satoshi-LightItalic.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://cdn.affine.pro/fonts/Satoshi-Italic.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://cdn.affine.pro/fonts/Satoshi-BoldItalic.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Italic,
  },
  // Poppins, https://fonts.cdnfonts.com/css/poppins?styles=20394,20389,20390,20391,20395,20396
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://cdn.affine.pro/fonts/Poppins-Light.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://cdn.affine.pro/fonts/Poppins-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://cdn.affine.pro/fonts/Poppins-SemiBold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://cdn.affine.pro/fonts/Poppins-LightItalic.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://cdn.affine.pro/fonts/Poppins-Italic.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://cdn.affine.pro/fonts/Poppins-SemiBoldItalic.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Italic,
  },
  // Lora, https://fonts.cdnfonts.com/css/lora-4?styles=50357,50356,50354,50355
  {
    font: CanvasTextFontFamily.Lora,
    url: 'https://cdn.affine.pro/fonts/Lora-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Lora,
    url: 'https://cdn.affine.pro/fonts/Lora-Bold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Lora,
    url: 'https://cdn.affine.pro/fonts/Lora-Italic.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Lora,
    url: 'https://cdn.affine.pro/fonts/Lora-BoldItalic.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Italic,
  },
  // BebasNeue, https://fonts.cdnfonts.com/css/bebas-neue?styles=169713,17622,17620
  {
    font: CanvasTextFontFamily.BebasNeue,
    url: 'https://cdn.affine.pro/fonts/BebasNeue-Light.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.BebasNeue,
    url: 'https://cdn.affine.pro/fonts/BebasNeue-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  // OrelegaOne, https://fonts.cdnfonts.com/css/orelega-one?styles=148618
  {
    font: CanvasTextFontFamily.OrelegaOne,
    url: 'https://cdn.affine.pro/fonts/OrelegaOne-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
];
export const CommunityCanvasTextFonts: FontConfig[] = [
  // Inter, https://fonts.cdnfonts.com/css/inter?styles=29139,29134,29135,29136,29140,29141
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://fonts.cdnfonts.com/s/19795/Inter-Light-BETA.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://fonts.cdnfonts.com/s/19795/Inter-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://fonts.cdnfonts.com/s/19795/Inter-SemiBold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://fonts.cdnfonts.com/s/19795/Inter-LightItalic-BETA.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://fonts.cdnfonts.com/s/19795/Inter-Italic.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Inter,
    url: 'https://fonts.cdnfonts.com/s/19795/Inter-SemiBoldItalic.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Italic,
  },
  // Kalam, https://fonts.cdnfonts.com/css/kalam?styles=15166,170689,170687
  {
    font: CanvasTextFontFamily.Kalam,
    url: 'https://fonts.cdnfonts.com/s/13130/Kalam-Light.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Kalam,
    url: 'https://fonts.cdnfonts.com/s/13130/Kalam-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Kalam,
    url: 'https://fonts.cdnfonts.com/s/13130/Kalam-Bold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  // Satoshi, https://fonts.cdnfonts.com/css/satoshi?styles=135009,135004,135005,135006,135002,135003
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://fonts.cdnfonts.com/s/85546/Satoshi-Light.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://fonts.cdnfonts.com/s/85546/Satoshi-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://fonts.cdnfonts.com/s/85546/Satoshi-Bold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://fonts.cdnfonts.com/s/85546/Satoshi-LightItalic.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://fonts.cdnfonts.com/s/85546/Satoshi-Italic.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Satoshi,
    url: 'https://fonts.cdnfonts.com/s/85546/Satoshi-BoldItalic.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Italic,
  },
  // Poppins, https://fonts.cdnfonts.com/css/poppins?styles=20394,20389,20390,20391,20395,20396
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://fonts.cdnfonts.com/s/16009/Poppins-Light.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://fonts.cdnfonts.com/s/16009/Poppins-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://fonts.cdnfonts.com/s/16009/Poppins-SemiBold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://fonts.cdnfonts.com/s/16009/Poppins-LightItalic.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://fonts.cdnfonts.com/s/16009/Poppins-Italic.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Poppins,
    url: 'https://fonts.cdnfonts.com/s/16009/Poppins-SemiBoldItalic.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Italic,
  },
  // Lora, https://fonts.cdnfonts.com/css/lora-4?styles=50357,50356,50354,50355
  {
    font: CanvasTextFontFamily.Lora,
    url: 'https://fonts.cdnfonts.com/s/29883/Lora-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Lora,
    url: 'https://fonts.cdnfonts.com/s/29883/Lora-Bold.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.Lora,
    url: 'https://fonts.cdnfonts.com/s/29883/Lora-Italic.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Italic,
  },
  {
    font: CanvasTextFontFamily.Lora,
    url: 'https://fonts.cdnfonts.com/s/29883/Lora-BoldItalic.woff',
    weight: CanvasTextFontWeight.SemiBold,
    style: CanvasTextFontStyle.Italic,
  },
  // BebasNeue, https://fonts.cdnfonts.com/css/bebas-neue?styles=169713,17622,17620
  {
    font: CanvasTextFontFamily.BebasNeue,
    url: 'https://fonts.cdnfonts.com/s/14902/BebasNeue%20Light.woff',
    weight: CanvasTextFontWeight.Light,
    style: CanvasTextFontStyle.Normal,
  },
  {
    font: CanvasTextFontFamily.BebasNeue,
    url: 'https://fonts.cdnfonts.com/s/14902/BebasNeue-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
  // OrelegaOne, https://fonts.cdnfonts.com/css/orelega-one?styles=148618
  {
    font: CanvasTextFontFamily.OrelegaOne,
    url: 'https://fonts.cdnfonts.com/s/93179/OrelegaOne-Regular.woff',
    weight: CanvasTextFontWeight.Regular,
    style: CanvasTextFontStyle.Normal,
  },
];
