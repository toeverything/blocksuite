import type { MenuItemGroup } from '@blocksuite/affine-components/toolbar';

import {
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
} from '@blocksuite/affine-components/icons';
import { toast } from '@blocksuite/affine-components/toast';
import { downloadBlob } from '@blocksuite/affine-shared/utils';

import type { EdgelessRootPreviewBlockComponent } from '../../edgeless/edgeless-root-preview-block.js';
import type { SurfaceRefToolbarContext } from './context.js';

import { edgelessToBlob, writeImageBlobToClipboard } from './utils.js';

export const BUILT_IN_GROUPS: MenuItemGroup<SurfaceRefToolbarContext>[] = [
  {
    type: 'clipboard',
    when: ctx => !!(ctx.blockComponent.referenceModel && ctx.doc.root),
    items: [
      {
        type: 'copy',
        label: 'Copy',
        icon: CopyIcon,
        action: ctx => {
          if (!(ctx.blockComponent.referenceModel && ctx.doc.root?.id)) {
            ctx.close();
            return;
          }

          const referencedModel = ctx.blockComponent.referenceModel;
          const editor = ctx.blockComponent.previewEditor;
          const edgelessRootElement = editor?.view.getBlock(ctx.doc.root.id);
          const surfaceRenderer = (
            edgelessRootElement as EdgelessRootPreviewBlockComponent
          )?.surface?.renderer;

          if (!surfaceRenderer) {
            ctx.close();
            return;
          }

          edgelessToBlob(ctx.host, {
            surfaceRefBlock: ctx.blockComponent,
            surfaceRenderer,
            edgelessElement: referencedModel,
          })
            .then(blob => writeImageBlobToClipboard(blob))
            .then(() => toast(ctx.host, 'Copied image to clipboard'))
            .catch(console.error);

          ctx.close();
        },
      },
      {
        type: 'download',
        label: 'Download',
        icon: DownloadIcon,
        action: ctx => {
          if (!(ctx.blockComponent.referenceModel && ctx.doc.root?.id)) {
            ctx.close();
            return;
          }

          const referencedModel = ctx.blockComponent.referenceModel;
          const editor = ctx.blockComponent.previewEditor;
          const edgelessRootElement = editor?.view.getBlock(ctx.doc.root.id);
          const surfaceRenderer = (
            edgelessRootElement as EdgelessRootPreviewBlockComponent
          )?.surface?.renderer;

          if (!surfaceRenderer) {
            ctx.close();
            return;
          }

          edgelessToBlob(ctx.host, {
            surfaceRefBlock: ctx.blockComponent,
            surfaceRenderer,
            edgelessElement: referencedModel,
          })
            .then(blob => {
              const fileName =
                'title' in referencedModel
                  ? (referencedModel.title?.toString() ?? 'Edgeless Content')
                  : 'Edgeless Content';

              downloadBlob(blob, fileName);
            })
            .catch(console.error);

          ctx.close();
        },
      },
    ],
  },
  {
    type: 'delete',
    items: [
      {
        type: 'delete',
        label: 'Delete',
        icon: DeleteIcon,
        disabled: ({ doc }) => doc.readonly,
        action: ({ blockComponent, doc, close }) => {
          doc.deleteBlock(blockComponent.model);
          close();
        },
      },
    ],
  },
];
