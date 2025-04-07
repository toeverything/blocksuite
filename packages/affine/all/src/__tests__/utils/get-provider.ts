import { SpecProvider } from '@blocksuite/affine-shared/utils';
import { Container } from '@blocksuite/global/di';

import {
  registerBlockSpecs,
  registerStoreSpecs,
} from '../../extensions/register';

registerStoreSpecs();
registerBlockSpecs();

export function getProvider() {
  const container = new Container();
  const exts = SpecProvider._.getSpec('store').value;
  exts.forEach(ext => {
    ext.setup(container);
  });
  return container.provider();
}
