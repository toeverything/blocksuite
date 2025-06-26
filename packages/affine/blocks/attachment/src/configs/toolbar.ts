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

// Utility to normalize filenames for comparison
function normalizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';
  // Trim whitespace, convert to lowercase, extract basename (remove path)
  return filename.trim().toLowerCase().split('/').pop() || '';
}

// Utility to get attachment blob
async function getAttachmentBlob(block: AttachmentBlockComponent): Promise<Blob | null> {
  const { model, blobUrl, resourceController, host, std } = block;

  console.log('getAttachmentBlob called for:', {
    name: model.props.name,
    sourceId: model.props.sourceId$.value,
    blobUrl: blobUrl,
    downloading: resourceController.state$.peek().downloading,
    blobSyncAvailable: !!std.store.blobSync,
  });

  // Reset downloading state to avoid conflicts
  if (resourceController.state$.peek().downloading) {
    console.log('Download in progress, resetting state for:', model.props.name);
    resourceController.updateState({ downloading: false, state: 'none' });
  }

  try {
    resourceController.updateState({ downloading: true });
    console.log('Forcing refreshData for:', model.props.name);
    await block.refreshData();
    console.log('refreshData completed, checking blobUrl:', block.blobUrl);

    if (block.blobUrl) {
      console.log('Fetching blob from blobUrl:', block.blobUrl);
      const response = await fetch(block.blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob from blobUrl: ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('Blob fetched from blobUrl, size:', blob.size);
      resourceController.updateState({ downloading: false, state: 'none' });
      return blob;
    }

    // Fallback to blobSync
    if (!model.props.sourceId$.value) {
      console.log('No sourceId, checking for local blob');
      const localBlob = await std.store.blobSync.getLocalBlob?.(model.id);
      if (localBlob) {
        console.log('Local blob found, size:', localBlob.size);
        resourceController.updateState({ downloading: false, state: 'none' });
        return localBlob;
      }
      throw new Error('No sourceId or local blob available for attachment');
    }

    console.log('Fetching blob from blobSync with sourceId:', model.props.sourceId$.value);
    const blob = await std.store.blobSync.get(model.props.sourceId$.value);
    if (!blob) {
      throw new Error(`Blob not found in blobSync for sourceId: ${model.props.sourceId$.value}`);
    }
    console.log('Blob fetched from blobSync, size:', blob.size);
    resourceController.updateState({ downloading: false, state: 'none' });
    return blob;
  } catch (error) {
    console.error('Blob fetch error:', error, {
      name: model.props.name,
      sourceId: model.props.sourceId$.value,
      blobUrl: block.blobUrl,
    });
    toast(host, `Failed to fetch blob for ${model.props.name}!`);
    resourceController.updateState({ downloading: false, state: 'error' });
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
  onClose: () => void = () => { };
  model: AttachmentBlockModel | null = null; // Store model reference
  block: AttachmentBlockComponent | null = null; // Store block reference
  std: any = null; // Store ctx.std for std.store.getBlock

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
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        console.log('Embed view disabled check:', {
          modelExists: !!model,
          sourceId: !!model?.props.sourceId$.value,
          fileName: model?.props.name,
        });
        return !model || !model.props.sourceId$.value || model.props.name?.endsWith('.dicomdir');
      },
      run(ctx) {
        console.log('Embed view triggered:', {
          name: ctx.getCurrentModelByType(AttachmentBlockModel)?.props.name,
          embed: ctx.getCurrentModelByType(AttachmentBlockModel)?.props.embed$.value,
        });
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        if (!model || !block) {
          console.error('Missing model or block');
          toast(block.host, 'Failed to load embed view');
          return;
        }

        try {
          const provider = ctx.std.get(AttachmentEmbedProvider);
          // Force state reset to trigger rendering
          ctx.store.updateBlock(model, { embed: false });
          console.log('Reset embed to false');
          setTimeout(() => {
            provider.convertTo(model);
            block.reload();
            console.log('Reload called, embed state:', model.props.embed$.value);
          }, 0);
        } catch (err) {
          console.error('Embed view failed:', {
            error: err.message,
            stack: err.stack,
            name: model.props.name,
          });
          toast(block.host, `Failed to load ${model.props.name}`);
        }

        if (provider.shouldBeConverted(model) && !ctx.hasSelectedSurfaceModels) {
          ctx.reset();
          ctx.select('note');
        }

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
        console.log('DICOM view disabled check:', {
          modelExists: !!model,
          sourceId: !!model?.props.sourceId$.value,
          fileName: model?.props.name,
        });
        if (!model) return true;
        const fileName = model.props.name || '';
        return !fileName.endsWith('.dicomdir');
      },
      run(ctx) {
        console.log('DICOM view triggered:', {
          name: ctx.getCurrentModelByType(AttachmentBlockModel)?.props.name,
        });
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
        if (!model || !block) {
          console.error('Missing model or block');
          return;
        }

        const isCloudFront = window.location.hostname.includes('docnosys.com');
        const viewerUrl = isCloudFront
          ? 'https://docnosys.com/qviewer'
          : 'http://localhost:5478';

        if (currentPopupInstance) {
          console.log('Removing existing popup instance');
          currentPopupInstance.onClose();
          currentPopupInstance = null;
        }

        console.log('Creating DICOM viewer popup for:', model.props.name);
        const abortController = new AbortController();
        const popup = document.createElement('dicom-viewer-popup') as DicomViewerPopup;
        popup.viewerUrl = viewerUrl;
        popup.model = model;
        popup.block = block;
        popup.std = ctx.std;
        console.log('Popup set:', { model: popup.model?.props.name, block: !!popup.block });
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
        console.log('currentPopupInstance created:', !!currentPopupInstance);

        const handleMessage = async (event: MessageEvent) => {
          console.log('BlockSuite iframe received message:', {
            data: event.data,
            origin: event.origin,
            expectedOrigin: viewerUrl,
          });

          const allowedOrigins = [viewerUrl, window.location.origin];
          if (!allowedOrigins.includes(event.origin)) {
            console.log('Ignoring message from unexpected origin:', event.origin);
            return;
          }

          if (typeof event.data !== 'object' || !event.data?.type) {
            console.log('Received invalid message:', event.data);
            return;
          }

          if (event.data.type === 'ohifReady' || event.data.type?.toLowerCase() === 'ohifready') {
            console.log('Processing ohifReady message for:', model.props.name);
            block.resourceController.updateState({ downloading: true });
            const fetchedBlob = await getAttachmentBlob(block);
            block.resourceController.updateState({ downloading: false, state: 'none' });
            if (!fetchedBlob) {
              console.error('Failed to fetch blob, cannot send to iframe');
              toast(block.host, 'Failed to load DICOM content');
              return;
            }

            try {
              const zip = new JSZip();
              const zipFile = await zip.loadAsync(fetchedBlob);
              console.log('ZIP file loaded, files:', Object.keys(zipFile.files));
              if (Object.keys(zipFile.files).length === 0) {
                console.error('ZIP file is empty for DICOM attachment:', model.props.name);
                toast(block.host, 'No DICOM files found in attachment');
                return;
              }
              const blobs = await Promise.all(
                Object.entries(zipFile.files)
                  .filter(([fileName, file]) => !file.dir)
                  .map(async ([fileName, file]) => {
                    const blob = await file.async('blob');
                    (blob as any).name = fileName;
                    console.log('Processed DICOM blob:', fileName, 'size:', blob.size);
                    return blob;
                  })
              );
              if (blobs.length === 0) {
                console.error('No DICOM files (.dcm) found in ZIP');
                toast(block.host, 'No DICOM files found in attachment');
                return;
              }
              const blobsWithMeta = blobs.map(blob => ({
                blob,
                name: (blob as any).name,
              }));
              console.log('Prepared blobsWithMeta:', blobsWithMeta.length);

              const popupEl = currentPopupInstance;
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
          } else {
            console.log('Unhandled message type:', event.data.type);
          }
        };

        window.addEventListener('message', handleMessage);
        abortController.signal.addEventListener('abort', () => {
          console.log('Cleaning up message listener');
          window.removeEventListener('message', handleMessage);
        });

        ctx.track('SelectedView', {
          ...trackBaseProps,
          control: 'select view',
          type: 'dicom view',
        });
      },
    },
  ],
  content(ctx) {
    console.log('attachmentViewDropdownMenu.content called', {
      block: !!ctx.getCurrentBlockByType(AttachmentBlockComponent),
    });
    const block = ctx.getCurrentBlockByType(AttachmentBlockComponent);
    if (!block) {
      console.log('No AttachmentBlockComponent found');
      return null;
    }

    const model = block.model;
    const actions = computed(() => {
      console.log('Computing actions for:', model.props.name);
      const [cardAction, embedAction, dicomAction] = this.actions.map(action => ({
        ...action,
      }));

      const sourceId = Boolean(model.props.sourceId$.value);
      const fileName = model.props.name || '';
      const isDicom = fileName.endsWith('.dicomdir');

      console.log('Action state:', { sourceId, isDicom });

      cardAction.disabled = false;
      embedAction.disabled = !sourceId || isDicom;
      dicomAction.disabled = !isDicom || !sourceId;

      console.log('Actions computed:', {
        cardDisabled: cardAction.disabled,
        embedDisabled: embedAction.disabled,
        dicomDisabled: dicomAction.disabled,
      });
      return isDicom ? [cardAction, dicomAction] : [cardAction, embedAction];
    });

    const viewType$ = computed(() => {
      const embed = model.props.embed$.value ?? false;
      const fileName = model.props.name || '';
      const isDicom = fileName.endsWith('.dicomdir');

      console.log('viewType$ computed:', { embed, isDicom });
      return isDicom ? 'DICOM view' : embed ? 'Embed view' : 'Card view';
    });

    const onToggle = (e: CustomEvent<boolean>) => {
      e.stopPropagation();
      const opened = e.detail;
      if (!opened) return;
      console.log('Dropdown toggled:', opened, 'viewType:', viewType$.value);
      if (block) {
        if (viewType$.value === 'Embed view') {
          console.log('Forcing reload for Embed view:', model.props.name);
          block.resourceController.updateState({ downloading: true });
          block.reload();
          block.resourceController.updateState({ downloading: false, state: 'none' });
        } else if (viewType$.value === 'DICOM view') {
          console.log('Triggering DICOM view for:', model.props.name);
          const isCloudFront = window.location.hostname.includes('docnosys.com');
          const viewerUrl = isCloudFront
            ? 'https://docnosys.com/qviewer'
            : 'http://localhost:5478';

          if (currentPopupInstance) {
            console.log('Removing existing popup instance');
            currentPopupInstance.onClose();
            currentPopupInstance = null;
          }

          console.log('Creating DICOM viewer popup for:', model.props.name);
          const abortController = new AbortController();
          const popup = document.createElement('dicom-viewer-popup') as DicomViewerPopup;
          popup.viewerUrl = viewerUrl;
          popup.model = model;
          popup.block = block;
          popup.std = ctx.std;
          console.log('Popup set:', { model: popup.model?.props.name, block: !!popup.block });
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
          console.log('currentPopupInstance created:', !!currentPopupInstance);

          const handleMessage = async (event: MessageEvent) => {
            console.log('BlockSuite iframe received message:', {
              data: event.data,
              origin: event.origin,
              expectedOrigin: viewerUrl,
            });

            const allowedOrigins = [viewerUrl, window.location.origin];
            if (!allowedOrigins.includes(event.origin)) {
              console.log('Ignoring message from unexpected origin:', event.origin);
              return;
            }

            if (typeof event.data !== 'object' || !event.data?.type) {
              console.log('Received invalid message:', event.data);
              return;
            }

            if (event.data.type === 'ohifReady' || event.data.type?.toLowerCase() === 'ohifready') {
              console.log('Processing ohifReady message for:', model.props.name);
              block.resourceController.updateState({ downloading: true });
              const fetchedBlob = await getAttachmentBlob(block);
              block.resourceController.updateState({ downloading: false, state: 'none' });
              if (!fetchedBlob) {
                console.error('Failed to fetch blob, cannot send to iframe');
                toast(block.host, 'Failed to load DICOM content');
                return;
              }

              try {
                const zip = new JSZip();
                const zipFile = await zip.loadAsync(fetchedBlob);
                console.log('ZIP file loaded, files:', Object.keys(zipFile.files));
                if (Object.keys(zipFile.files).length === 0) {
                  console.error('ZIP file is empty for DICOM attachment:', model.props.name);
                  toast(block.host, 'No DICOM files found in attachment');
                  return;
                }
                const blobs = await Promise.all(
                  Object.entries(zipFile.files)
                    .filter(([fileName, file]) => !file.dir)
                    .map(async ([fileName, file]) => {
                      const blob = await file.async('blob');
                      (blob as any).name = fileName;
                      console.log('Processed DICOM blob:', fileName, 'size:', blob.size);
                      return blob;
                    })
                );
                if (blobs.length === 0) {
                  console.error('No DICOM files (.dcm) found in ZIP');
                  toast(block.host, 'No DICOM files found in attachment');
                  return;
                }
                const blobsWithMeta = blobs.map(blob => ({
                  blob,
                  name: (blob as any).name,
                }));
                console.log('Prepared blobsWithMeta:', blobsWithMeta.length);

                const popupEl = currentPopupInstance;
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
            } else {
              console.log('Unhandled message type:', event.data.type);
            }
          };

          window.addEventListener('message', handleMessage);
          abortController.signal.addEventListener('abort', () => {
            console.log('Cleaning up message listener');
            window.removeEventListener('message', handleMessage);
          });

          ctx.track('SelectedView', {
            ...trackBaseProps,
            control: 'select view',
            type: 'dicom view',
          });
        }
      }
      ctx.track('OpenedViewSelector', {
        ...trackBaseProps,
        control: 'switch view',
      });
    };

    console.log('Rendering dropdown for:', model.props.name);
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
        console.log('Rename action content called', {
          blockExists: !!ctx.getCurrentBlockByType(AttachmentBlockComponent),
        });
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
        console.log('Style action content called', {
          modelExists: !!ctx.getCurrentModelByType(AttachmentBlockModel),
        });
        const model = ctx.getCurrentModelByType(AttachmentBlockModel);
        if (!model) return null;

        const actions = this.actions.map(action => ({
          ...action,
          run: ({ store }) => {
            console.log('Style action run:', action.id);
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
  when: ctx => {
    console.log('builtinSurfaceToolbarConfig when check:', {
      surfaceModels: ctx.getSurfaceModelsByType(AttachmentBlockModel).length,
    });
    return ctx.getSurfaceModelsByType(AttachmentBlockModel).length === 1;
  },
} as const satisfies ToolbarModuleConfig;

export const createBuiltinToolbarConfigExtension = (
  flavour: string
): ExtensionType[] => {
  console.log('createBuiltinToolbarConfigExtension called with flavour:', flavour);
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