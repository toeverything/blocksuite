import { MenuButton, MobileMenuButton } from './button';
import { MenuInput, MobileMenuInput } from './input';
import { MenuDivider } from './menu-divider';
import { MenuComponent, MobileMenuComponent } from './menu-renderer';
import { MenuSubMenu, MobileSubMenu } from './sub-menu';

export * from './button';
export * from './focusable';
export * from './group';
export * from './input';
export * from './item';
export * from './menu';
export * from './menu-all';
export * from './menu-divider';
export * from './menu-renderer';
export * from './sub-menu';

export function effects() {
  customElements.define('affine-menu', MenuComponent);
  customElements.define('mobile-menu', MobileMenuComponent);
  customElements.define('affine-menu-button', MenuButton);
  customElements.define('mobile-menu-button', MobileMenuButton);
  customElements.define('affine-menu-input', MenuInput);
  customElements.define('mobile-menu-input', MobileMenuInput);
  customElements.define('affine-menu-sub-menu', MenuSubMenu);
  customElements.define('mobile-sub-menu', MobileSubMenu);
  customElements.define('menu-divider', MenuDivider);
}

export * from './types.js';
