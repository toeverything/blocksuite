import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import {
  createIdentifier,
  type ServiceIdentifier,
  type ServiceProvider,
} from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';

import type { InlineSpecs } from './type.js';

export const InlineSpecIdentifier =
  createIdentifier<InlineSpecs<AffineTextAttributes>>('AffineInlineSpec');

export function InlineSpecExtension(
  name: string,
  getSpec: (provider: ServiceProvider) => InlineSpecs<AffineTextAttributes>
): ExtensionType & {
  identifier: ServiceIdentifier<InlineSpecs<AffineTextAttributes>>;
};
export function InlineSpecExtension(
  spec: InlineSpecs<AffineTextAttributes>
): ExtensionType & {
  identifier: ServiceIdentifier<InlineSpecs<AffineTextAttributes>>;
};
export function InlineSpecExtension(
  nameOrSpec: string | InlineSpecs<AffineTextAttributes>,
  getSpec?: (provider: ServiceProvider) => InlineSpecs<AffineTextAttributes>
): ExtensionType & {
  identifier: ServiceIdentifier<InlineSpecs<AffineTextAttributes>>;
} {
  if (typeof nameOrSpec === 'string') {
    const identifier = InlineSpecIdentifier(nameOrSpec);
    return {
      identifier,
      setup: di => {
        di.addImpl(identifier, provider => getSpec!(provider));
      },
    };
  }
  const identifier = InlineSpecIdentifier(nameOrSpec.name);
  return {
    identifier,
    setup: di => {
      di.addImpl(identifier, nameOrSpec);
    },
  };
}
