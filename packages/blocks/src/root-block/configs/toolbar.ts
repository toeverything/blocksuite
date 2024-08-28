import type { MoreMenuItemGroup } from '@blocksuite/affine-components/toolbar';
import type { BlockStdScope, EditorHost } from '@blocksuite/block-std';
import type { GfxModel } from '@blocksuite/block-std/gfx';
import type { BlockModel, Doc } from '@blocksuite/store';

export abstract class MoreMenuContext {
  isElement() {
    return false;
  }

  get config(): ToolbarMoreMenuConfig {
    return {
      configure: <T extends MoreMenuContext>(groups: MoreMenuItemGroup<T>[]) =>
        groups,
      ...this.std.spec.getConfig('affine:page')?.toolbarMoreMenu,
    };
  }

  get firstElement(): GfxModel | null {
    return null;
  }

  abstract get doc(): Doc;

  abstract get host(): EditorHost;

  abstract isEmpty(): boolean;

  abstract get selectedBlockModels(): BlockModel[];

  abstract get std(): BlockStdScope;
}

export interface ToolbarMoreMenuConfig {
  configure: <T extends MoreMenuContext>(
    groups: MoreMenuItemGroup<T>[]
  ) => MoreMenuItemGroup<T>[];
}
