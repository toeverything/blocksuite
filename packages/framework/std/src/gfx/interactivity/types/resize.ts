import type { GfxModel } from '../../model/model';
import type { ResizeHandle } from '../resize/manager';

export type ExtensionElementResizeContext = {
  elements: GfxModel[];
};

export type ExtensionElementResizeStartContext = {
  elements: GfxModel[];

  handle: ResizeHandle;
};

export type ExtensionElementResizeEndContext =
  ExtensionElementResizeStartContext;

export type ExtensionElementResizeMoveContext =
  ExtensionElementResizeStartContext & {
    dx: number;
    dy: number;

    lockRatio: boolean;

    handleSign: {
      xSign: number;
      ySign: number;
    };

    suggest: (distance: { dx: number; dy: number }) => void;
  };
