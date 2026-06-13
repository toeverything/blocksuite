import { mountShapeTextEditor } from '@labre/affine-gfx-shape';
import {
  type BpmnNodeElementModel,
  ShapeElementModel,
} from '@labre/affine-model';
import { GfxElementModelView } from '@labre/std/gfx';

/**
 * View for a BPMN flow-object node. Registering it ensures `gfx.view.get(model)`
 * returns a view (required so move / select / connector interactions work).
 *
 * BPMN nodes are native shapes, so we reuse the shape inner-text editor: a
 * double-click mounts the editable text overlay (`mountShapeTextEditor`),
 * exactly like a native shape (used to label the task).
 *
 * Mirrors {@link EdgyNodeView}.
 */
export class BpmnNodeView extends GfxElementModelView<BpmnNodeElementModel> {
  static override type: string = 'bpmnNode';

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
