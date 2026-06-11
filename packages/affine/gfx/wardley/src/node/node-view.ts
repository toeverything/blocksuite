import type { WardleyNodeElementModel } from '@labre/affine-model';
import { GfxElementModelView } from '@labre/std/gfx';

/**
 * View for a Wardley node. Registering it ensures `gfx.view.get(model)` returns
 * a view (required so move / select / connector interactions work). The label
 * is a separate native text element, so no custom editing is needed here.
 */
export class WardleyNodeView extends GfxElementModelView<WardleyNodeElementModel> {
  static override type: string = 'wardleyNode';
}
