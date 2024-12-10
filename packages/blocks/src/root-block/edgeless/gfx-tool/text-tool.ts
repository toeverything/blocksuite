import type { TextElementModel } from '@blocksuite/affine-model';
import type { PointerEventState } from '@blocksuite/block-std';

import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import { BaseTool, type GfxController } from '@blocksuite/block-std/gfx';
import { Bound } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';

import { mountTextElementEditor } from '../utils/text.js';

export function addText(gfx: GfxController, event: PointerEventState) {
  const [x, y] = gfx.viewport.toModelCoord(event.x, event.y);
  const selected = gfx.getElementByPoint(x, y);

  if (!selected) {
    const [modelX, modelY] = gfx.viewport.toModelCoord(event.x, event.y);

    if (!gfx.surface) {
      return;
    }

    const id = gfx.surface.addElement({
      type: 'text',
      xywh: new Bound(modelX, modelY, 32, 32).serialize(),
      text: new DocCollection.Y.Text(),
    });
    gfx.doc.captureSync();
    const textElement = gfx.getElementById(id) as TextElementModel;
    const edgelessView = gfx.std.view.getBlock(gfx.std.doc.root!.id);
    mountTextElementEditor(
      textElement,
      edgelessView as EdgelessRootBlockComponent
    );
  }
}

export class TextTool extends BaseTool {
  static override toolName: string = 'text';

  override click(e: PointerEventState): void {
    const textFlag = this.gfx.doc.awarenessStore.getFlag(
      'enable_edgeless_text'
    );

    if (textFlag) {
      const [x, y] = this.gfx.viewport.toModelCoord(e.x, e.y);
      this.gfx.std.command.exec('insertEdgelessText', { x, y });
      this.gfx.tool.setTool('default');
    } else {
      addText(this.gfx, e);
    }

    this.gfx.std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
      control: 'canvas:draw',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: 'text',
    });
  }
}

declare module '@blocksuite/block-std/gfx' {
  interface GfxToolsMap {
    text: TextTool;
  }
}
