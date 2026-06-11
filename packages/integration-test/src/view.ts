import { ViewExtensionManager } from '@labre/affine/ext-loader';
import { getInternalViewExtensions } from '@labre/affine/extensions/view';

const manager = new ViewExtensionManager(getInternalViewExtensions());

export function getTestViewManager() {
  return manager;
}
