import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@labre/affine-ext-loader';
import { EdgelessTextBlockSchemaExtension } from '@labre/affine-model';

export class EdgelessTextStoreExtension extends StoreExtensionProvider {
  override name = 'affine-edgeless-text-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(EdgelessTextBlockSchemaExtension);
  }
}
