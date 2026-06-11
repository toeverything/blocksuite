import { mountShapeTextEditor } from '@blocksuite/affine-gfx-shape';
import {
  type EdgyNodeElementModel,
  ShapeElementModel,
} from '@blocksuite/affine-model';
import { GfxElementModelView } from '@blocksuite/std/gfx';

/**
 * View for an EDGY base-element node. Registering it ensures `gfx.view.get(model)`
 * returns a view (required so move / select / connector interactions work).
 *
 * EDGY nodes are native shapes, so we reuse the shape inner-text editor: a
 * double-click mounts the editable text overlay (`mountShapeTextEditor`), exactly
 * like a native shape. We deliberately do NOT inherit the polygon vertex-editing
 * overlay (the Activity chevron should keep its shape).
 */
export class EdgyNodeView extends GfxElementModelView<EdgyNodeElementModel> {
  static override type: string = 'edgyNode';

  override onCreated(): void {
    super.onCreated();
    this.on('dblclick', () => {
      const edgeless = this.std.view.getBlock(this.std.store.root!.id);
      if (
        edgeless &&
        !this.model.isLocked() &&
        this.model instanceof ShapeElementModel
      ) {
        mountShapeTextEditor(this.model, edgeless);
      }
    });
  }
}
