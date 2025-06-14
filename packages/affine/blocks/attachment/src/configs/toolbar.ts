import { createLitPortal } from '@blocksuite/affine-components/portal';
import {
  AttachmentBlockModel,
  defaultAttachmentProps,
  type EmbedCardStyle,
} from '@blocksuite/affine-model';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import {
  ActionPlacement,
  type ToolbarAction,
  type ToolbarActionGroup,
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@blocksuite/affine-shared/services';
import { getBlockProps } from '@blocksuite/affine-shared/utils';
import { Bound } from '@blocksuite/global/gfx';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  DuplicateIcon,
  EditIcon,
  ResetIcon,
} from '@blocksuite/icons/lit';
import { BlockFlavourIdentifier } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { computed } from '@preact/signals-core';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import JSZip from 'jszip';
import { toast } from '@blocksuite/affine-components/toast';

import { AttachmentBlockComponent } from '../attachment-block';
import { RenameModal } from '../components/rename-model';
import { AttachmentEmbedProvider } from '../embed';

// Utility to get attachment blob
async function getAttachmentBlob(block: AttachmentBlockComponent): Promise<Blob | null> {
  const { model, blobUrl, resourceController, host } = block;

  console.log('getAttachmentBlob called for:', model.props.name, 'blobUrl:', blobUrl);

  if (resourceController.state$.peek().downloading) {
    toast(host, 'Download in progress...');
    console.log('Download in progress, returning null');
    return null;
  }

  if (!blobUrl) {
    toast(host, `Failed to fetch blob for ${model.props.name}!`);
    console.log('No blobUrl available');
    return null;
  }

  try {
    resourceController.updateState({ downloading: true });
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    const blob = await response.blob();
    resourceController.updateState({ downloading: false });
    console.log('Blob fetched successfully, size:', blob.size);
    return blob;
  } catch (error) {
    console.error('Blob fetch error:', error);
    toast(host, `Failed to fetch blob for ${model.props.name}!`);
    resourceController.updateState({ downloading: false });
    return null;
  }
}

// Define a Lit component for the DICOM viewer popup
@customElement('dicom-viewer-popup')
class DicomViewerPopup extends LitElement {
  static override styles = css`
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .popup-container {
      background: white;
      width: 90vw;
      height: 100vh;
      position: relative;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #ff4d4f;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 16px;
      z-index: 1001;
    }
    .close-button:hover {
      background: #d9363e;
    }
    iframe {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
    }
  `;

  // Properties
  viewerUrl = '';
  onClose: () => void = () => {};

  override render() {
    console.log('Rendering DicomViewerPopup, viewerUrl:', this.viewerUrl);
    return html`
      <div class="popup-overlay" @click=${this._handleOutsideClick}>
        <div class="popup-container">
          <button class="close-button" @click=${this._handleClose}>Close</button>
          <iframe id="dicom-viewer" src=${this.viewerUrl} title="DICOM Viewer"></iframe>
        </div>
      </div>
    `;
  }

  private _handleOutsideClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.popup-container')) {
      this._handleClose();
    }
  }

  private _handleClose() {
    const iframe = this.shadowRoot?.getElementById('dicom-viewer') as HTMLIFrameElement;
    if (iframe) {
      console.log('Sending cleanup message to iframe:', this.viewerUrl);
      iframe.contentWindow?.postMessage({ type: 'cleanup' }, this.viewerUrl);
    }
    console.log('Closing popup');
    this.onClose();
  }
}

// Track current popup instance
let currentPopupInstance: DicomViewerPopup | null = null;

const trackBaseProps = {
  category: 'attachment',
  type: 'card view',
};

export const attachmentViewDropdownMenu = {
  id: 'b.conversions',
  actions: [
    {
      id: 'card',
      label: 'Card view',
      run(ctx) {
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        if (!model) return;

        const style = defaultAttachmentProps.style!;
        const width = EMBED_CARD_WIDTH[style];
        const height = EMBED_CARD_HEIGHT[style];
        const bounds = Bound.deserialize(model.xywh);
        bounds.w = width;
        bounds.h = height;

        ctx.store.updateBlock(model, {
          style,
          embed: false,
          xywh: bounds.serialize(),
        });
      },
    },
    {
      id: 'embed',
      label: 'Embed view',
      disabled: ctx => {
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        return block ? !block.embedded() : true;
      },
      run(ctx) {
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        if (!model) return;

        const provider = ctx.std.get(AttachmentEmbedProvider);

        if (
          provider.shouldBeConverted(model) &&
          !ctx.hasSelectedSurfaceModels
        ) {
          ctx.reset();
          ctx.select('note');
        }

        provider.convertTo(model);

        ctx.track('SelectedView', {
          ...trackBaseProps,
          control: 'select view',
          type: 'embed view',
        });
      },
    },
    {
      id: 'dicom',
      label: 'DICOM view',
      disabled: ctx => {
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        if (!model) return true;
        const fileName = model.props.name || '';
        return !fileName.endsWith('.dicomdir');
      },
      run(ctx) {
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        if (!model || !block) return;

        // Determine iframe URL
        const isCloudFront = window.location.hostname.includes('docnosys.com');
        const viewerUrl = isCloudFront
          ? 'https://docnosys.com/qviewer'
          : 'http://localhost:5478';

        // Remove existing popup if it exists
        if (currentPopupInstance) {
          console.log('Removing existing popup instance');
          currentPopupInstance.onClose();
          currentPopupInstance = null;
        }

        // Create new popup
        console.log('Creating DICOM viewer popup for:', model.props.name);
        const abortController = new AbortController();
        const popup = document.createElement('dicom-viewer-popup') as DicomViewerPopup;
        popup.viewerUrl = viewerUrl;
        popup.onClose = () => {
          currentPopupInstance?.remove();
          currentPopupInstance = null;
          abortController.abort();
        };
        currentPopupInstance = popup;

        const portal = createLitPortal({
          template: popup,
          abortController,
        });
        console.log('currentPopupInstance created:', currentPopupInstance);

        // Message handling
        const handleMessage = async (event: MessageEvent) => {
          console.log('BlockSuite iframe received message:', {
            data: event.data,
            origin: event.origin,
            expectedOrigin: viewerUrl,
            type: event.data?.type,
            typeType: typeof event.data?.type,
          });

          // Allow messages from viewerUrl or BlockSuite iframe’s origin
          const allowedOrigins = [viewerUrl, window.location.origin];
          if (!allowedOrigins.includes(event.origin)) {
            console.log('Ignoring message from unexpected origin:', event.origin);
            return;
          }

          if (typeof event.data === 'object' && event.data && (event.data.type === 'ohifReady' || event.data.type?.toLowerCase() === 'ohifready')) {
            console.log('Processing ohifReady message');
            const fetchedBlob = await getAttachmentBlob(block);
            if (!fetchedBlob) {
              console.error('Failed to fetch blob, cannot send to iframe');
              toast(block.host, 'Failed to load DICOM content');
              return;
            }

            try {
              const zip = new JSZip();
              const zipFile = await zip.loadAsync(fetchedBlob);
              console.log('ZIP file loaded, files:', Object.keys(zipFile.files));
              const blobs = await Promise.all(
                Object.entries(zipFile.files)
                  .filter(([fileName, file]) => !file.dir)
                  .map(async ([fileName, file]) => {
                    const blob = await file.async('blob');
                    (blob as any).name = fileName;
                    console.log('Processed blob:', fileName, 'size:', blob.size);
                    return blob;
                  })
              );
              const blobsWithMeta = blobs.map(blob => ({
                blob,
                name: (blob as any).name,
              }));
              console.log('Prepared blobsWithMeta:', blobsWithMeta.length);

              // Access the popup instance directly
              const popupEl = currentPopupInstance;
              console.log('Using popup instance:', popupEl);
              if (!popupEl) {
                console.error('Popup instance not available');
                toast(block.host, 'Failed to load DICOM viewer');
                return;
              }

              const iframe = popupEl.shadowRoot?.getElementById('dicom-viewer') as HTMLIFrameElement | null;
              if (!iframe || !iframe.contentWindow) {
                console.error('DICOM viewer iframe not found or contentWindow unavailable');
                toast(block.host, 'Failed to load DICOM viewer');
                return;
              }
              console.log('Sending blobs to iframe:', viewerUrl);
              iframe.contentWindow.postMessage(blobsWithMeta, viewerUrl);

              blobsWithMeta.length = 0;
              blobs.length = 0;
            } catch (error) {
              console.error('Error processing ZIP:', error);
              toast(block.host, 'Failed to process DICOM content');
            }
          } else if (event.data.type === 'appendFiles') {
            console.log('Received appendFiles message');
            const { files }: { files: File[] } = event.data;
            if (files && files.length > 0) {
              const doc = block.std.doc || model.doc;
              if (!doc) {
                console.error('Document unavailable for block update');
                toast(block.host, 'Failed to update attachment');
                return;
              }
              const parent = model.parent;
              const originalName = model.props.name;
              const originalCaption = model.props.caption;
              const parentId = parent.id;

              const originalBlob = await getAttachmentBlob(block);
              const zip = new JSZip();

              if (originalBlob) {
                const originalZip = await zip.loadAsync(originalBlob);
                await Promise.all(
                  Object.entries(originalZip.files).map(async ([filename, file]) => {
                    if (!file.dir) {
                      const blob = await file.async('blob');
                      zip.file(filename, blob);
                    }
                  })
                );
              }

              Array.from(files).forEach((file, index) => {
                const filename = file.name;
                zip.file(filename, file);
              });

              const combinedZipBlob = await zip.generateAsync({ type: 'blob' });

              const oldSourceId = model.props.sourceId;
              doc.deleteBlock(model);
              if (oldSourceId) {
                await doc.blobSync.delete(oldSourceId);
              }

              const newSourceId = await doc.blobSync.set(combinedZipBlob);
              const newAttachmentProps = {
                name: originalName,
                size: combinedZipBlob.size,
                type: 'application/zip',
                sourceId: newSourceId,
                caption: originalCaption,
                embed: false,
                style: model.props.style || 'horizontalThin',
                index: model.props.index,
                xywh: model.props.xywh,
                lockedBySelf: false,
                rotate: 0,
              };

              const newBlockId = doc.addBlock('affine:attachment', newAttachmentProps, parentId);
              const newModel = doc.getBlockById(newBlockId) as AttachmentBlockModel;
              window.dispatchEvent(
                new CustomEvent('attachmentUpdated', {
                  detail: {
                    blockId: newBlockId,
                    size: combinedZipBlob.size,
                  },
                })
              );

              console.log('Attachment replaced with combined ZIP');
              Object.assign(model, newModel);
            }
          } else if (event.data.type === 'removeFiles') {
            console.log('Received removeFiles message');
            const { file_names }: { file_names: string[] } = event.data;
            if (file_names && file_names.length > 0) {
              const doc = block.std.doc || model.doc;
              if (!doc) {
                console.error('Document unavailable for block update');
                toast(block.host, 'Failed to update attachment');
                return;
              }
              const parent = model.parent;
              const originalName = model.props.name;
              const originalCaption = model.props.caption;
              const parentId = parent.id;

              const originalBlob = await getAttachmentBlob(block);
              const newZip = new JSZip();

              if (originalBlob) {
                const originalZip = await newZip.loadAsync(originalBlob);
                await Promise.all(
                  Object.entries(originalZip.files).map(async ([filename, file]) => {
                    if (!file.dir && !file_names.includes(filename)) {
                      const blob = await file.async('blob');
                      newZip.file(filename, blob);
                    }
                  })
                );
              }

              const updatedZipBlob = await newZip.generateAsync({ type: 'blob' });

              const oldSourceId = model.props.sourceId;
              doc.deleteBlock(model);
              if (oldSourceId) {
                await doc.blobSync.delete(oldSourceId);
              }

              const newSourceId = await doc.blobSync.set(updatedZipBlob);
              const newAttachmentProps = {
                name: originalName,
                size: updatedZipBlob.size,
                type: 'application/zip',
                sourceId: newSourceId,
                caption: originalCaption,
                embed: false,
                style: model.props.style || 'horizontalThin',
                index: model.props.index,
                xywh: model.props.xywh,
                lockedBySelf: false,
                rotate: 0,
              };

              const newBlockId = doc.addBlock('affine:attachment', newAttachmentProps, parentId);
              const newModel = doc.getBlockById(newBlockId) as AttachmentBlockModel;
              console.log('Attachment replaced with updated ZIP (files removed)');
              window.dispatchEvent(
                new CustomEvent('attachmentUpdated', {
                  detail: {
                    blockId: newBlockId,
                    size: combinedZipBlob.size,
                  },
                })
              );

              Object.assign(model, newModel);
            }
          }
        };

        // Add message listener
        window.addEventListener('message', handleMessage);

        // Cleanup on component unmount
        abortController.signal.addEventListener('abort', () => {
          console.log('Cleaning up message listener');
          window.removeEventListener('message', handleMessage);
        });

        // Track event
        ctx.track('SelectedView', {
          ...trackBaseProps,
          control: 'select view',
          type: 'dicom view',
        });
      },
    },
  ],
  content(ctx) {
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) return null;

    const model = block.model;
    const embedProvider = ctx.std.get(AttachmentEmbedProvider);
    const actions = computed(() => {
      const [cardAction, embedAction, dicomAction] = this.actions.map(action => ({
        ...action,
      }));

      const ok = block.resourceController.resolvedState$.value.state === 'none';
      const sourceId = Boolean(model.props.sourceId$.value);
      const embed = model.props.embed$.value ?? false;
      const fileName = model.props.name || '';
      const isDicom = fileName.endsWith('.dicomdir');

      const allowed = ok && sourceId && embedProvider.embedded(model) && !embed;

      cardAction.disabled = isDicom ? false : !embed;
      embedAction.disabled = !allowed;
      dicomAction.disabled = !isDicom || !ok || !sourceId;

      return isDicom ? [cardAction, dicomAction] : [cardAction, embedAction];
    });
    const viewType$ = computed(() => {
      const embed = model.props.embed$.value ?? false;
      const fileName = model.props.name || '';
      const isDicom = fileName.endsWith('.dicomdir');

      if (isDicom) {
        return 'Card view';
      }
      return embed ? actions.value[1].label : actions.value[0].label;
    });
    const onToggle = (e: CustomEvent<boolean>) => {
      e.stopPropagation();
      const opened = e.detail;
      if (!opened) return;

      ctx.track('OpenedViewSelector', {
        ...trackBaseProps,
        control: 'switch view',
      });
    };

    return html`${keyed(
      model,
      html`<affine-view-dropdown-menu
        @toggle=${onToggle}
        .actions=${actions.value}
        .context=${ctx}
        .viewType$=${viewType$}
      ></affine-view-dropdown-menu>`
    )}`;
  },
} as const satisfies ToolbarActionGroup<ToolbarAction>;

const downloadAction = {
  id: 'c.download',
  tooltip: 'Download',
  icon: DownloadIcon(),
  run(ctx) {
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    block?.download();
  },
  when: ctx => {
    const model = ctx.getCurrentModelByType(AttachmentBlockModel);
    if (!model) return false;
    return model.props.style !== 'citation' && !model.props.footnoteIdentifier;
  },
} as const satisfies ToolbarAction;

const captionAction = {
  id: 'd.caption',
  tooltip: 'Caption',
  icon: CaptionIcon(),
  run(ctx) {
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    block?.captionEditor?.show();

    ctx.track('OpenedCaptionEditor', {
      ...trackBaseProps,
      control: 'add caption',
    });
  },
} as const satisfies ToolbarAction;

const builtinToolbarConfig = {
  actions: [
    {
      id: 'a.rename',
      content(ctx) {
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        if (!block) return null;

        const abortController = new AbortController();
        abortController.signal.onabort = () => ctx.show();

        return html`
          <editor-icon-button
            aria-label="Rename"
            .tooltip="${'Rename'}"
            @click=${() => {
              ctx.hide();

              createLitPortal({
                template: RenameModal({
                  model: block.model,
                  editorHost: ctx.host,
                  abortController,
                }),
                computePosition: {
                  referenceElement: block,
                  placement: 'top-start',
                  middleware: [flip(), offset(4)],
                },
                abortController,
              });
            }}
          >
            ${EditIcon()}
          </editor-icon-button>
        `;
      },
    },
    attachmentViewDropdownMenu,
    downloadAction,
    captionAction,
    {
      placement: ActionPlacement.More,
      id: 'a.clipboard',
      actions: [
        {
          id: 'copy',
          label: 'Copy',
          icon: CopyIcon(),
          run(ctx) {
            const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
            block?.copy();
          },
        },
        {
          id: 'duplicate',
          label: 'Duplicate',
          icon: DuplicateIcon(),
          run(ctx) {
            const model = ctx.getCurrentModelByType(AttachmentBlockModel);
            if (!model) return;

            ctx.store.addSiblingBlocks(model, [
              {
                flavour: model.flavour,
                ...getBlockProps(model),
              },
            ]);
          },
        },
      ],
    },
    {
      placement: ActionPlacement.More,
      id: 'b.refresh',
      label: 'Reload',
      icon: ResetIcon(),
      run(ctx) {
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        block?.reload();

        ctx.track('AttachmentReloadedEvent', {
          ...trackBaseProps,
          control: 'reload',
          type: block?.model.props.name.split('.').pop() ?? '',
        });
      },
    },
    {
      placement: ActionPlacement.More,
      id: 'c.delete',
      label: 'Delete',
      icon: DeleteIcon(),
      variant: 'destructive',
      run(ctx) {
        const model = ctx.getCurrentModel();
        if (!model) return;

        ctx.store.deleteBlock(model.id);

        ctx.select('note');
        ctx.reset();
      },
    },
  ],
} as const satisfies ToolbarModuleConfig;

const builtinSurfaceToolbarConfig = {
  actions: [
    attachmentViewDropdownMenu,
    {
      id: 'c.style',
      actions: [
        {
          id: 'horizontalThin',
          label: 'Horizontal style',
        },
        {
          id: 'cubeThick',
          label: 'Vertical style',
        },
      ],
      content(ctx) {
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        if (!model) return null;

        const actions = this.actions.map(action => ({
          ...action,
          run: ({ store }) => {
            const style = action.id as EmbedCardStyle;
            const bounds = Bound.deserialize(model.xywh);
            bounds.w = EMBED_CARD_WIDTH[style];
            bounds.h = EMBED_CARD_HEIGHT[style];
            const xywh = bounds.serialize();

            store.updateBlock(model, { style, xywh });

            ctx.track('SelectedCardStyle', {
              ...trackBaseProps,
              page: 'whiteboard editor',
              control: 'select card style',
              type: style,
            });
          },
        })) satisfies ToolbarAction[];
        const style$ = model.props.style$;
        const onToggle = (e: CustomEvent<boolean>) => {
          e.stopPropagation();
          const opened = e.detail;
          if (!opened) return;

          ctx.track('OpenedCardStyleSelector', {
            ...trackBaseProps,
            page: 'whiteboard editor',
            control: 'switch card style',
          });
        };

        return html`${keyed(
          model,
          html`<affine-card-style-dropdown-menu
            @toggle=${onToggle}
            .actions=${actions}
            .context=${ctx}
            .style$=${style$}
          ></affine-card-style-dropdown-menu>`
        )}`;
      },
    } satisfies ToolbarActionGroup<ToolbarAction>,
    {
      ...downloadAction,
      id: 'd.download',
    },
    {
      ...captionAction,
      id: 'e.caption',
    },
  ],
  when: ctx => ctx.getSurfaceModelsByType(AttachmentBlockModel).length === 1,
} as const satisfies ToolbarModuleConfig;

export const createBuiltinToolbarConfigExtension = (
  flavour: string
): ExtensionType[] => {
  const name = flavour.split(':').pop();

  return [
    ToolbarModuleExtension({
      id: BlockFlavourIdentifier(flavour),
      config: builtinToolbarConfig,
    }),

    ToolbarModuleExtension({
      id: BlockFlavourIdentifier(`affine:surface:${name}`),
      config: builtinSurfaceToolbarConfig,
    }),
  ];
};