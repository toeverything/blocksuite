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
    sourceId: model.props.sourceId,
    blobUrl: blobUrl,
    blobSyncAvailable: !!std.store.blobSync,
  });

  if (resourceController.state$.peek().downloading) {
    console.log('Download in progress, returning null');
    toast(host, 'Download in progress...');
    return null;
  }

  try {
    resourceController.updateState({ downloading: true });

    // If blobUrl is available, use it
    if (blobUrl) {
      console.log('Fetching blob from existing blobUrl:', blobUrl);
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob from blobUrl: ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('Blob fetched from blobUrl, size:', blob.size);
      resourceController.updateState({ downloading: false, state: 'none' });
      return blob;
    }

    // If no blobUrl, fetch from blobSync using sourceId
    if (!model.props.sourceId) {
      throw new Error('No sourceId available for attachment');
    }

    console.log('Fetching blob from blobSync with sourceId:', model.props.sourceId);
    const blob = await std.store.blobSync.get(model.props.sourceId);
    if (!blob) {
      throw new Error(`Blob not found in blobSync for sourceId: ${model.props.sourceId}`);
    }

    // Create blobUrl for future use
    block.blobUrl = URL.createObjectURL(blob);
    console.log('Blob fetched from blobSync, size:', blob.size, 'new blobUrl:', block.blobUrl);
    resourceController.updateState({ downloading: false, state: 'none' });
    return blob;
  } catch (error) {
    console.error('Blob fetch error:', error, {
      name: model.props.name,
      sourceId: model.props.sourceId,
      blobUrl: blobUrl,
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
    .loading-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.8);
      padding: 16px;
      border-radius: 4px;
      font-size: 16px;
      color: #333;
    }
  `;

  // Properties
  viewerUrl = '';
  onClose: () => void = () => {};
  model: AttachmentBlockModel | null = null; // Store model reference
  block: AttachmentBlockComponent | null = null; // Store block reference
  std: any = null; // Store ctx.std for std.store.getBlock
  loading = true; // Add loading state

  override render() {
    console.log('Rendering DicomViewerPopup, viewerUrl:', this.viewerUrl, 'loading:', this.loading);
    return html`
      <div class="popup-overlay" @click=${this._handleOutsideClick}>
        <div class="popup-container">
          <button class="close-button" @click=${this._handleClose}>Close</button>
          ${this.loading ? html`<div class="loading-message">Loading DICOM content...</div>` : null}
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
        popup.model = model; // Pass the model reference
        popup.block = block; // Pass the block reference
        popup.std = ctx.std; // Pass ctx.std for std.store.getBlock
        popup.loading = true; // Start in loading state
        console.log('Popup set:', { model: popup.model, block: popup.block, stdStore: ctx.std.store }); // Debug log
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

          // Log all message types for debugging
          if (typeof event.data === 'object' && event.data && event.data.type) {
            console.log(`Received message type: ${event.data.type}`);
          } else {
            console.log('Received invalid or unknown message:', event.data);
            return;
          }

          try {
            if (!currentPopupInstance || !currentPopupInstance.model || !currentPopupInstance.block || !currentPopupInstance.std) {
              console.log('No active popup instance, model, block, or std, ignoring message');
              return;
            }

            const model = currentPopupInstance.model;
            const block = currentPopupInstance.block;
            const store = model.store; // Workspace
            const std = currentPopupInstance.std; // Std for std.store.getBlock
            console.log('Store and Std accessed:', {
              store,
              stdStore: std.store,
              storeMethods: {
                deleteBlock: typeof store.deleteBlock,
                addBlock: typeof store.addBlock,
              },
              stdStoreMethods: {
                getBlock: typeof std.store.getBlock,
              },
              blobSync: store.blobSync ? 'available' : 'undefined'
            }); // Debug log

            if (event.data.type === 'ohifReady' || event.data.type?.toLowerCase() === 'ohifready') {
              console.log('Processing ohifReady message');
              const fetchedBlob = await getAttachmentBlob(block);
              if (!fetchedBlob) {
                console.error('Failed to fetch blob, cannot send to iframe');
                toast(block.host, 'Failed to load DICOM content');
                currentPopupInstance.loading = false;
                currentPopupInstance.requestUpdate();
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

                const popupEl = currentPopupInstance;
                console.log('Using popup instance:', popupEl);
                if (!popupEl) {
                  console.error('Popup instance not available');
                  toast(block.host, 'Failed to load DICOM viewer');
                  currentPopupInstance.loading = false;
                  currentPopupInstance.requestUpdate();
                  return;
                }

                const iframe = popupEl.shadowRoot?.getElementById('dicom-viewer') as HTMLIFrameElement | null;
                if (!iframe || !iframe.contentWindow) {
                  console.error('DICOM viewer iframe not found or contentWindow unavailable');
                  toast(block.host, 'Failed to load DICOM viewer');
                  currentPopupInstance.loading = false;
                  currentPopupInstance.requestUpdate();
                  return;
                }
                console.log('Sending blobs to iframe:', viewerUrl);
                iframe.contentWindow.postMessage(blobsWithMeta, viewerUrl);

                blobsWithMeta.length = 0;
                blobs.length = 0;
                currentPopupInstance.loading = false;
                currentPopupInstance.requestUpdate();
              } catch (error) {
                console.error('Error processing ZIP:', error);
                toast(block.host, 'Failed to process DICOM content');
                currentPopupInstance.loading = false;
                currentPopupInstance.requestUpdate();
              }
            } else if (event.data.type === 'appendFiles') {
              console.log('Received appendFiles message');
              const { files }: { files: File[] } = event.data;
              if (files && files.length > 0) {
                if (!store || typeof store.addBlock !== 'function' || typeof store.deleteBlock !== 'function') {
                  console.error('Invalid store or required methods missing:', store);
                  toast(block.host, 'Failed to update attachment: invalid store');
                  return;
                }
                if (!std || typeof std.store.getBlock !== 'function') {
                  console.error('Invalid std or getBlock method missing:', std);
                  toast(block.host, 'Failed to update attachment: invalid std');
                  return;
                }
                if (!model.parent) {
                  console.error('Parent unavailable for block update');
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
                  console.log('Original ZIP files in appendFiles:', Object.keys(originalZip.files));
                  await Promise.all(
                    Object.entries(originalZip.files).map(async ([filename, file]) => {
                      if (!file.dir) {
                        const blob = await file.async('blob');
                        zip.file(filename, blob);
                        console.log('Added file to zip in appendFiles:', filename);
                      }
                    })
                  );
                }

                Array.from(files).forEach((file, index) => {
                  const filename = file.name;
                  zip.file(filename, file);
                  console.log('Appended new file:', filename);
                });

                const combinedZipBlob = await zip.generateAsync({ type: 'blob' });
                console.log('Generated combinedZipBlob, size:', combinedZipBlob.size);

                const oldSourceId = model.props.sourceId;
                store.deleteBlock(model);
                console.log('Deleted block:', model.id);
                if (oldSourceId && store.blobSync) {
                  console.log('Deleting old blob:', oldSourceId);
                  await store.blobSync.delete(oldSourceId);
                }

                const newSourceId = await store.blobSync.set(combinedZipBlob);
                console.log('Set new blob, sourceId:', newSourceId);
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

                const newBlockId = store.addBlock('affine:attachment', newAttachmentProps, parentId);
                console.log('Added new block:', newBlockId);
                const newBlock = std.store.getBlock(newBlockId);
                if (!newBlock || !newBlock.model) {
                  console.error('Failed to retrieve new block:', newBlockId);
                  toast(block.host, 'Failed to update attachment: block not found');
                  return;
                }
                const newModel = newBlock.model as AttachmentBlockModel;
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
            } else if (event.data.type === 'removeFiles' || event.data.type?.toLowerCase() === 'removefiles') {
              console.log('Received removeFiles message');
              const { file_names }: { file_names: string[] } = event.data;
              console.log('File names to remove:', file_names);

              if (!Array.isArray(file_names) || file_names.length === 0) {
                console.error('Invalid or empty file_names:', file_names);
                toast(block.host, 'Failed to update attachment: invalid file names');
                return;
              }

              // Validate file_names entries
              const validFileNames = file_names.filter(name => typeof name === 'string' && name.trim().length > 0);
              if (validFileNames.length === 0) {
                console.error('No valid file names after filtering:', file_names);
                toast(block.host, 'Failed to update attachment: no valid file names');
                return;
              }

              if (!store || typeof store.addBlock !== 'function' || typeof store.deleteBlock !== 'function') {
                console.error('Invalid store or required methods missing:', store);
                toast(block.host, 'Failed to update attachment: invalid store');
                return;
              }
              if (!std || typeof std.store.getBlock !== 'function') {
                console.error('Invalid std or getBlock method missing:', std);
                toast(block.host, 'Failed to update attachment: invalid std');
                return;
              }
              if (!model.parent) {
                console.error('Parent unavailable for block update');
                toast(block.host, 'Failed to update attachment');
                return;
              }
              const parent = model.parent;
              const originalName = model.props.name;
              const originalCaption = model.props.caption;
              const parentId = parent.id;

              const originalBlob = await getAttachmentBlob(block);
              const newZip = new JSZip();
              const includedFiles: string[] = [];
              const excludedFiles: string[] = [];

              if (originalBlob) {
                const originalZip = await JSZip.loadAsync(originalBlob);
                console.log('Original ZIP files in removeFiles:', Object.keys(originalZip.files));

                // Normalize file_names for comparison
                const normalizedFileNames = validFileNames.map(normalizeFilename);
                console.log('Normalized file names to remove:', normalizedFileNames);

                // Build ZIP from scratch, adding only non-removed files
                for (const [filename, file] of Object.entries(originalZip.files)) {
                  if (!file.dir) {
                    const normalizedFilename = normalizeFilename(filename);
                    if (!normalizedFileNames.includes(normalizedFilename)) {
                      const blob = await file.async('blob');
                      newZip.file(filename, blob);
                      includedFiles.push(filename);
                      console.log('Included file in newZip:', filename);
                    } else {
                      excludedFiles.push(filename);
                      console.log('Excluded file:', filename);
                    }
                  }
                }
              } else {
                console.log('No original blob, creating empty ZIP');
              }

              console.log('Included files in newZip:', includedFiles);
              console.log('Excluded files:', excludedFiles);

              const updatedZipBlob = await newZip.generateAsync({ type: 'blob' });
              console.log('Generated updatedZipBlob, size:', updatedZipBlob.size);

              const oldSourceId = model.props.sourceId;
              store.deleteBlock(model);
              console.log('Deleted block:', model.id);
              if (oldSourceId && store.blobSync) {
                console.log('Deleting old blob:', oldSourceId);
                await store.blobSync.delete(oldSourceId);
              }

              const newSourceId = await store.blobSync.set(updatedZipBlob);
              console.log('Set new blob, sourceId:', newSourceId);
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

              const newBlockId = store.addBlock('affine:attachment', newAttachmentProps, parentId);
              console.log('Added new block:', newBlockId);
              const newBlock = std.store.getBlock(newBlockId);
              if (!newBlock || !newBlock.model) {
                console.error('Failed to retrieve new block:', newBlockId);
                toast(block.host, 'Failed to update attachment: block not found');
                return;
              }
              const newModel = newBlock.model as AttachmentBlockModel;
              console.log('Attachment replaced with updated ZIP (files removed)', { newBlockId, zipSize: updatedZipBlob.size });
              window.dispatchEvent(
                new CustomEvent('attachmentUpdated', {
                  detail: {
                    blockId: newBlockId,
                    size: updatedZipBlob.size,
                  },
                })
              );

              Object.assign(model, newModel);
            } else {
              console.log('Unhandled message type:', event.data.type);
            }
          } catch (error) {
            console.error('Error handling message:', error, event.data);
            toast(block.host, 'Error processing message');
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

      // Only disable DICOM action if it's not a DICOM file
      cardAction.disabled = isDicom ? false : !embed;
      embedAction.disabled = !ok || !sourceId || !embedProvider.embedded(model) || embed;
      dicomAction.disabled = !isDicom; // Simplified condition

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