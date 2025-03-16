import { StoreExtension } from '@blocksuite/store';

import { setImageProxyMiddlewareURL } from './adapters/middleware';

export class ImageProxyService extends StoreExtension {
  static override key = 'image-proxy';

  setImageProxyURL = setImageProxyMiddlewareURL;
}
