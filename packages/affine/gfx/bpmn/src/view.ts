import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@labre/affine-ext-loader';
import { extendTemplateCategory } from '@labre/affine-gfx-template';

import { effects } from './effects';
import { bpmnTemplateCategory } from './templates';
import { BpmnPoolRendererExtension } from './element-renderer';
import { BpmnPoolInteraction, BpmnPoolView } from './element-view';
import { BpmnNodeRendererExtension } from './node/node-renderer';
import { BpmnNodeView } from './node/node-view';
import { bpmnPoolToolbarExtension } from './toolbar/config';
import { bpmnSeniorTool } from './toolbar/senior-tool';

export class BpmnViewExtension extends ViewExtensionProvider {
  override name = 'affine-bpmn-gfx';

  override effect(): void {
    super.effect();
    effects();
    extendTemplateCategory(bpmnTemplateCategory);
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(BpmnPoolView);
    context.register(BpmnPoolRendererExtension);
    context.register(BpmnNodeView);
    context.register(BpmnNodeRendererExtension);
    if (this.isEdgeless(context.scope)) {
      context.register(BpmnPoolInteraction);
      context.register(bpmnSeniorTool);
      context.register(bpmnPoolToolbarExtension);
    }
  }
}
