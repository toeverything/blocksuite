import { BlockService, type BlockServiceOptions } from '@blocksuite/block-std';

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
import { CanvasTextFont } from './edgeless/utils/consts.js';
import { type FontConfig, FontLoader } from './font-loader/font-loader.js';
import type { PageBlockModel } from './page-model.js';

export class PageService extends BlockService<PageBlockModel> {
  fonts: FontConfig[] = [
    // Inter, https://fonts.cdnfonts.com/css/inter?styles=29139,29135,29140
    {
      font: CanvasTextFont.Inter,
      url: 'https://fonts.cdnfonts.com/s/19795/Inter-Light-BETA.woff',
      weight: '300',
    },
    {
      font: CanvasTextFont.Inter,
      url: 'https://fonts.cdnfonts.com/s/19795/Inter-Regular.woff',
      weight: '400',
    },
    {
      font: CanvasTextFont.Inter,
      url: 'https://fonts.cdnfonts.com/s/19795/Inter-SemiBold.woff',
      weight: '600',
    },
    // Kalam, https://fonts.cdnfonts.com/css/kalam?styles=15166,170689,170687
    {
      font: CanvasTextFont.Kalam,
      url: 'https://fonts.cdnfonts.com/s/13130/Kalam-Light.woff',
      weight: '300',
    },
    {
      font: CanvasTextFont.Kalam,
      url: 'https://fonts.cdnfonts.com/s/13130/Kalam-Regular.woff',
      weight: '400',
    },
    {
      font: CanvasTextFont.Kalam,
      url: 'https://fonts.cdnfonts.com/s/13130/Kalam-Bold.woff',
      weight: '700',
    },
    // Satoshi, https://fonts.cdnfonts.com/css/satoshi?styles=135009,135005,135002
    {
      font: CanvasTextFont.Satoshi,
      url: 'https://fonts.cdnfonts.com/s/85546/Satoshi-Light.woff',
      weight: '300',
    },
    {
      font: CanvasTextFont.Satoshi,
      url: 'https://fonts.cdnfonts.com/s/85546/Satoshi-Regular.woff',
      weight: '400',
    },
    {
      font: CanvasTextFont.Satoshi,
      url: 'https://fonts.cdnfonts.com/s/85546/Satoshi-Bold.woff',
      weight: '700',
    },
    // Poppins, https://fonts.cdnfonts.com/css/poppins?styles=20394,20390,20395
    {
      font: CanvasTextFont.Poppins,
      url: 'https://fonts.cdnfonts.com/s/16009/Poppins-Light.woff',
      weight: '300',
    },
    {
      font: CanvasTextFont.Poppins,
      url: 'https://fonts.cdnfonts.com/s/16009/Poppins-Regular.woff',
      weight: '400',
    },
    {
      font: CanvasTextFont.Poppins,
      url: 'https://fonts.cdnfonts.com/s/16009/Poppins-SemiBold.woff',
      weight: '600',
    },
    // Lora, https://fonts.cdnfonts.com/css/lora-4?styles=50357,50354
    {
      font: CanvasTextFont.Lora,
      url: 'https://fonts.cdnfonts.com/s/29883/Lora-Regular.woff',
      weight: '400',
    },
    {
      font: CanvasTextFont.Lora,
      url: 'https://fonts.cdnfonts.com/s/29883/Lora-Bold.woff',
      weight: '700',
    },
    // BebasNeue, https://fonts.cdnfonts.com/css/bebas-neue?styles=169713,17622,17620
    {
      font: CanvasTextFont.BebasNeue,
      url: 'https://fonts.cdnfonts.com/s/14902/BebasNeue%20Light.woff',
      weight: '300',
    },
    {
      font: CanvasTextFont.BebasNeue,
      url: 'https://fonts.cdnfonts.com/s/14902/BebasNeue-Regular.woff',
      weight: '400',
    },
    {
      font: CanvasTextFont.BebasNeue,
      url: 'https://fonts.cdnfonts.com/s/14902/BebasNeue%20Bold.woff',
      weight: '700',
    },
    // OrelegaOne, https://fonts.cdnfonts.com/css/orelega-one?styles=148618
    {
      font: CanvasTextFont.OrelegaOne,
      url: 'https://fonts.cdnfonts.com/s/93179/OrelegaOne-Regular.woff',
      weight: '400',
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
