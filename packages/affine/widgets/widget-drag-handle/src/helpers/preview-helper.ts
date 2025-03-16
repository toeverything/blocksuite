import { SurfaceBlockModel } from '@blocksuite/affine-block-surface';
import { RootBlockModel } from '@blocksuite/affine-model';
import {
  DocModeExtension,
  DocModeProvider,
  EditorSettingExtension,
  EditorSettingProvider,
} from '@blocksuite/affine-shared/services';
import { matchModels, SpecProvider } from '@blocksuite/affine-shared/utils';
import {
  type BlockComponent,
  BlockStdScope,
  BlockViewIdentifier,
  LifeCycleWatcher,
} from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import type {
  BlockModel,
  BlockViewType,
  ExtensionType,
  Query,
  SliceSnapshot,
} from '@blocksuite/store';
import { signal } from '@preact/signals-core';
import { literal } from 'lit/static-html.js';

import type { AffineDragHandleWidget } from '../drag-handle.js';
import { getSnapshotRect } from '../utils.js';

export class PreviewHelper {
  private readonly _calculateQuery = (
    selectedIds: string[],
    mode: 'block' | 'gfx'
  ): Query => {
    const ids: Array<{ id: string; viewType: BlockViewType }> = selectedIds.map(
      id => ({
        id,
        viewType: 'display',
      })
    );

    // The ancestors of the selected blocks should be rendered as Bypass
    selectedIds.forEach(block => {
      let parent: string | null = block;
      do {
        if (!selectedIds.includes(parent)) {
          ids.push({ viewType: 'bypass', id: parent });
        }
        parent = this.widget.doc.getParent(parent)?.id ?? null;
      } while (parent && !ids.map(({ id }) => id).includes(parent));
    });

    // The children of the selected blocks should be rendered as Display
    const addChildren = (id: string) => {
      const model = this.widget.doc.getBlock(id)?.model;
      if (!model) {
        return;
      }

      const children = model.children ?? [];
      if (
        mode === 'gfx' &&
        matchModels(model, [RootBlockModel, SurfaceBlockModel])
      ) {
        children.forEach(child => {
          if (selectedIds.includes(child.id)) {
            ids.push({ viewType: 'display', id: child.id });
            addChildren(child.id);
          }
        });
      } else {
        children.forEach(child => {
          ids.push({ viewType: 'display', id: child.id });
          addChildren(child.id);
        });
      }
    };
    selectedIds.forEach(addChildren);

    return {
      match: ids,
      mode: 'strict',
    };
  };

  getPreviewStd = (
    blockIds: string[],
    snapshot: SliceSnapshot,
    mode: 'block' | 'gfx'
  ) => {
    const widget = this.widget;
    const std = widget.std;
    const sourceGfx = std.get(GfxControllerIdentifier);
    const isEdgeless = mode === 'gfx';
    blockIds = blockIds.slice();

    if (isEdgeless) {
      blockIds.push(sourceGfx.surface!.id, std.store.root!.id);
    }

    const docModeService = std.get(DocModeProvider);
    const editorSetting = std.get(EditorSettingProvider).peek();
    const query = this._calculateQuery(blockIds as string[], mode);
    const store = widget.doc.doc.getStore({ query });
    const previewSpec = SpecProvider._.getSpec(
      isEdgeless ? 'preview:edgeless' : 'preview:page'
    );
    const settingSignal = signal({ ...editorSetting });
    const extensions = [
      DocModeExtension(docModeService),
      EditorSettingExtension(settingSignal),
      {
        setup(di) {
          di.override(
            BlockViewIdentifier('affine:database'),
            () => literal`affine-dnd-preview-database`
          );
        },
      } as ExtensionType,
      {
        setup(di) {
          di.override(BlockViewIdentifier('affine:image'), () => {
            return (model: BlockModel) => {
              const parent = model.doc.getParent(model.id);

              if (parent?.flavour === 'affine:surface') {
                return literal`affine-edgeless-placeholder-preview-image`;
              }

              return literal`affine-placeholder-preview-image`;
            };
          });
        },
      } as ExtensionType,
    ];

    if (isEdgeless) {
      class PreviewViewportInitializer extends LifeCycleWatcher {
        static override key = 'preview-viewport-initializer';

        override mounted(): void {
          const rect = getSnapshotRect(snapshot);
          if (!rect) {
            return;
          }

          this.std.view.viewUpdated.subscribe(payload => {
            if (payload.type !== 'block') return;

            if (payload.view.model.flavour === 'affine:page') {
              const gfx = this.std.get(GfxControllerIdentifier);

              (
                payload.view as BlockComponent & { overrideBackground: string }
              ).overrideBackground = 'transparent';

              gfx.viewport.setViewportByBound(rect);
            }
          });
        }
      }

      extensions.push(PreviewViewportInitializer);
    }

    previewSpec.extend(extensions);

    settingSignal.value = {
      ...settingSignal.value,
      edgelessDisableScheduleUpdate: true,
    };

    const previewStd = new BlockStdScope({
      store,
      extensions: previewSpec.value,
    });

    let width: number = 500;
    let height;
    let scale = 1;

    if (isEdgeless) {
      const rect = getSnapshotRect(snapshot);
      if (rect) {
        width = rect.w;
        height = rect.h;
      } else {
        height = 500;
      }
      scale = sourceGfx.viewport.zoom;
    } else {
      const noteBlock = this.widget.host.querySelector('affine-note');
      width = noteBlock?.offsetWidth ?? noteBlock?.clientWidth ?? 500;
    }

    return {
      scale,
      previewStd,
      width,
      height,
    };
  };

  renderDragPreview = (options: {
    blockIds: string[];
    snapshot: SliceSnapshot;
    container: HTMLElement;
    mode: 'block' | 'gfx';
  }): void => {
    const { blockIds, snapshot, container, mode } = options;
    const { previewStd, width, height, scale } = this.getPreviewStd(
      blockIds,
      snapshot,
      mode
    );
    const previewTemplate = previewStd.render();

    container.style.transform = `scale(${scale})`;
    container.style.width = `${width}px`;
    if (height) {
      container.style.height = `${height}px`;
    }
    container.append(previewTemplate);
  };

  constructor(readonly widget: AffineDragHandleWidget) {}
}
