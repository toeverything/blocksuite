import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@labre/affine-ext-loader';
import {
  HtmlAdapterFactoryExtension,
  ImageProxyService,
  MarkdownAdapterFactoryExtension,
  MixTextAdapterFactoryExtension,
  NotionHtmlAdapterFactoryExtension,
  NotionTextAdapterFactoryExtension,
  PlainTextAdapterFactoryExtension,
} from '@labre/affine-shared/adapters';
import { HighlightSelectionExtension } from '@labre/affine-shared/selection';
import {
  BlockMetaService,
  FeatureFlagService,
} from '@labre/affine-shared/services';
import {
  BlockSelectionExtension,
  CursorSelectionExtension,
  SurfaceSelectionExtension,
  TextSelectionExtension,
} from '@labre/std';

export class FoundationStoreExtension extends StoreExtensionProvider {
  override name = 'foundation';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register([
      // predefined selections
      BlockSelectionExtension,
      TextSelectionExtension,
      SurfaceSelectionExtension,
      CursorSelectionExtension,
      HighlightSelectionExtension,

      // predefined adapters
      MarkdownAdapterFactoryExtension,
      PlainTextAdapterFactoryExtension,
      HtmlAdapterFactoryExtension,
      NotionTextAdapterFactoryExtension,
      NotionHtmlAdapterFactoryExtension,
      MixTextAdapterFactoryExtension,

      // shared services
      FeatureFlagService,
      BlockMetaService,
      // TODO(@mirone): maybe merge these services into a file setting service
      ImageProxyService,
    ]);
  }
}
