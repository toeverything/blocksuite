import { SpecProvider } from '@blocksuite/affine-shared/utils';
import { Container } from '@blocksuite/global/di';

import { registerSpecs } from '../../extensions/register';

registerSpecs();

export function getProvider() {
  const container = new Container();
  const exts = SpecProvider._.getSpec('store').value;
  exts.forEach(ext => {
    ext.setup(container);
  });
  return container.provider();
}
