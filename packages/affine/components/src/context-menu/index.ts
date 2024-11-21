import { MenuButton, MobileMenuButton } from './button.js';
import { MenuInput, MobileMenuInput } from './input.js';
import { MenuComponent, MobileMenuComponent } from './menu-renderer.js';
import { MenuSubMenu, MobileSubMenu } from './sub-menu.js';

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
  customElements.define('mobile-menu', MobileMenuComponent);
  customElements.define('affine-menu-button', MenuButton);
  customElements.define('mobile-menu-button', MobileMenuButton);
  customElements.define('affine-menu-input', MenuInput);
  customElements.define('mobile-menu-input', MobileMenuInput);
  customElements.define('affine-menu-sub-menu', MenuSubMenu);
  customElements.define('mobile-sub-menu', MobileSubMenu);
}

export * from './types.js';
