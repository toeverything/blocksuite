import { MenuButton } from './button.js';
import { MenuInput } from './input.js';
import { MenuComponent } from './menu-renderer.js';
import { MenuSubMenu } from './sub-menu.js';

export * from './button.js';
export * from './focusable.js';
export * from './group.js';
export * from './input.js';
export * from './item.js';
export * from './menu.js';
export * from './menu-renderer.js';
export * from './sub-menu.js';

export function effects() {
  customElements.define('affine-menu', MenuComponent);
  customElements.define('affine-menu-button', MenuButton);
  customElements.define('affine-menu-input', MenuInput);
  customElements.define('affine-menu-sub-menu', MenuSubMenu);
}

export * from './types.js';
