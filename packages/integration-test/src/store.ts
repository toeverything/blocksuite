import { StoreExtensionManager } from '@labre/affine/ext-loader';
import { getInternalStoreExtensions } from '@labre/affine/extensions/store';

const manager = new StoreExtensionManager(getInternalStoreExtensions());

export function getTestStoreManager() {
  return manager;
}
