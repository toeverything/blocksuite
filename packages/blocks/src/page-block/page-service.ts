import { BlockService, type BlockServiceOptions } from '@blocksuite/block-std';

import {
  CanvasTextFontFamily,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
} from '../surface-block/consts.js';
import {
  copySelectedModelsCommand,
  deleteSelectedModelsCommand,
  deleteTextCommand,
  formatBlockCommand,
  formatNativeCommand,
  formatTextCommand,
  getBlockIndexCommand,
  getBlockSelectionsCommand,
  getImageSelectionsCommand,
  getNextBlockCommand,
  getPrevBlockCommand,
  getSelectedBlocksCommand,
  getSelectedModelsCommand,
  getTextSelectionCommand,
  withRootCommand,
} from './commands/index.js';
import { type FontConfig, FontLoader } from './font-loader/font-loader.js';
import type { PageBlockModel } from './page-model.js';

export class PageService extends BlockService<PageBlockModel> {
  fonts: FontConfig[] = [
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
  readonly fontLoader: FontLoader;

  constructor(options: BlockServiceOptions) {
    super(options);

    this.fontLoader = new FontLoader(this.fonts);
  }

  override mounted() {
    super.mounted();
    this.std.command
      .add('getBlockIndex', getBlockIndexCommand)
      .add('getNextBlock', getNextBlockCommand)
      .add('getPrevBlock', getPrevBlockCommand)
      .add('getSelectedBlocks', getSelectedBlocksCommand)
      .add('copySelectedModels', copySelectedModelsCommand)
      .add('deleteSelectedModels', deleteSelectedModelsCommand)
      .add('getSelectedModels', getSelectedModelsCommand)
      .add('getBlockSelections', getBlockSelectionsCommand)
      .add('getImageSelections', getImageSelectionsCommand)
      .add('getTextSelection', getTextSelectionCommand)
      .add('deleteText', deleteTextCommand)
      .add('formatBlock', formatBlockCommand)
      .add('formatNative', formatNativeCommand)
      .add('formatText', formatTextCommand)
      .add('withRoot', withRootCommand);
  }
}
