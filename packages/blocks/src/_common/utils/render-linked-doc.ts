import type { EditorHost } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  type BlockModel,
  type BlockSelector,
  BlockViewType,
  type Doc,
} from '@blocksuite/store';
import { css, render, type TemplateResult } from 'lit';

import type { EmbedLinkedDocBlockComponent } from '../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedSyncedDocCard } from '../../embed-synced-doc-block/components/embed-synced-doc-card.js';
import type { ImageBlockModel } from '../../image-block/index.js';
import type { NoteBlockModel } from '../../note-block/note-model.js';
import { EdgelessBlockModel } from '../../root-block/edgeless/edgeless-block-model.js';
import {
  getElementProps,
  sortEdgelessElements,
} from '../../root-block/edgeless/utils/clone-utils.js';
import { isNoteBlock } from '../../root-block/edgeless/utils/query.js';
import { SpecProvider } from '../../specs/utils/spec-provider.js';
import { Bound, getCommonBound } from '../../surface-block/utils/bound.js';
import { getSurfaceBlock } from '../../surface-ref-block/utils.js';
import { EMBED_CARD_HEIGHT } from '../consts.js';
import { type DocMode, NoteDisplayMode } from '../types.js';
import { getBlockProps } from './block-props.js';
import { matchFlavours } from './model.js';

export const embedNoteContentStyles = css`
  .affine-embed-doc-content-note-blocks affine-divider,
  .affine-embed-doc-content-note-blocks affine-divider > * {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .affine-embed-doc-content-note-blocks affine-paragraph,
  .affine-embed-doc-content-note-blocks affine-list {
    margin-top: 4px !important;
    margin-bottom: 4px !important;
    padding: 0 2px;
  }
  .affine-embed-doc-content-note-blocks affine-paragraph *,
  .affine-embed-doc-content-note-blocks affine-list * {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
    padding-top: 0;
    padding-bottom: 0;
    line-height: 20px;
    font-size: var(--affine-font-xs);
    font-weight: 400;
  }
  .affine-embed-doc-content-note-blocks affine-list .affine-list-block__prefix {
    height: 20px;
  }
  .affine-embed-doc-content-note-blocks affine-paragraph .quote {
    padding-left: 15px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h1),
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h2),
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h3),
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h4),
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h5),
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h6) {
    margin-top: 6px !important;
    margin-bottom: 4px !important;
    padding: 0 2px;
  }
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h1) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h2) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h3) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h4) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h5) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h6) * {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
    padding-top: 0;
    padding-bottom: 0;
    line-height: 20px;
    font-size: var(--affine-font-xs);
    font-weight: 600;
  }

  .affine-embed-linked-doc-block.horizontal {
    affine-paragraph,
    affine-list {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      max-height: 40px;
      overflow: hidden;
      display: flex;
    }
    affine-paragraph .quote {
      padding-top: 4px;
      padding-bottom: 4px;
      height: 28px;
    }
    affine-paragraph .quote::after {
      height: 20px;
      margin-top: 4px !important;
      margin-bottom: 4px !important;
    }
  }
`;

export function promptDocTitle(host: EditorHost, autofill?: string) {
  const notification =
    host.std.spec.getService('affine:page').notificationService;
  if (!notification) return Promise.resolve(undefined);

  return notification.prompt({
    title: 'Create linked doc',
    message: 'Enter a title for the new doc.',
    placeholder: 'Untitled',
    autofill,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });
}

export function getTitleFromSelectedModels(selectedModels: BlockModel[]) {
  const firstBlock = selectedModels[0];
  if (
    matchFlavours(firstBlock, ['affine:paragraph']) &&
    firstBlock.type.startsWith('h')
  ) {
    return firstBlock.text.toString();
  }
  return undefined;
}

export function notifyDocCreated(host: EditorHost, doc: Doc) {
  const notification =
    host.std.spec.getService('affine:page').notificationService;
  if (!notification) return;

  const abortController = new AbortController();
  const clear = () => {
    doc.history.off('stack-item-added', addHandler);
    doc.history.off('stack-item-popped', popHandler);
    disposable.dispose();
  };
  const closeNotify = () => {
    abortController.abort();
    clear();
  };

  // edit or undo or switch doc, close notify toast
  const addHandler = doc.history.on('stack-item-added', closeNotify);
  const popHandler = doc.history.on('stack-item-popped', closeNotify);
  const disposable = host.slots.unmounted.on(closeNotify);

  notification.notify({
    title: 'Linked doc created',
    message: 'You can click undo to recovery block content',
    accent: 'info',
    duration: 10 * 1000,
    action: {
      label: 'Undo',
      onClick: () => {
        doc.undo();
        clear();
      },
    },
    abort: abortController.signal,
    onClose: clear,
  });
}

export function renderLinkedDocInCard(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard
) {
  const linkedDoc = card.linkedDoc;
  assertExists(
    linkedDoc,
    `Trying to load page ${card.model.pageId} in linked page block, but the page is not found.`
  );

  renderSurfaceRef(card);

  renderNoteContent(card).catch(e => {
    console.error(e);
    card.isError = true;
  });
}

export function getNotesFromDoc(doc: Doc) {
  const notes = doc.root?.children.filter(
    child =>
      matchFlavours(child, ['affine:note']) &&
      child.displayMode !== NoteDisplayMode.EdgelessOnly
  );

  if (!notes || !notes.length) {
    return null;
  }

  return notes;
}

export function isEmptyDoc(doc: Doc | null, mode: DocMode) {
  if (!doc) {
    return true;
  }

  if (mode === 'page') {
    const notes = getNotesFromDoc(doc);
    if (!notes || !notes.length) {
      return true;
    }
    return notes.every(note => isEmptyNote(note));
  } else {
    const surface = getSurfaceBlock(doc);
    if (surface?.elementModels.length || doc.blocks.size > 2) {
      return false;
    }
    return true;
  }
}

export function isEmptyNote(note: BlockModel) {
  return note.children.every(block => {
    return (
      block.flavour === 'affine:paragraph' &&
      (!block.text || block.text.length === 0)
    );
  });
}

function filterTextModel(model: BlockModel) {
  if (matchFlavours(model, ['affine:divider'])) {
    return true;
  }
  if (!matchFlavours(model, ['affine:paragraph', 'affine:list'])) {
    return false;
  }
  return !!model.text?.toString().length;
}

async function renderNoteContent(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard
) {
  card.isNoteContentEmpty = true;

  const doc = card.linkedDoc;
  assertExists(
    doc,
    `Trying to load page ${card.model.pageId} in linked page block, but the page is not found.`
  );

  const notes = getNotesFromDoc(doc);
  if (!notes) {
    return;
  }

  const noteChildren = notes.flatMap(note =>
    note.children.filter(filterTextModel)
  );

  if (!noteChildren.length) {
    return;
  }

  card.isNoteContentEmpty = false;

  const cardStyle = card.model.style;

  const noteContainer = await card.noteContainer;
  while (noteContainer.firstChild) {
    noteContainer.firstChild.remove();
  }

  const noteBlocksContainer = document.createElement('div');
  noteBlocksContainer.classList.add('affine-embed-doc-content-note-blocks');
  noteBlocksContainer.contentEditable = 'false';
  noteContainer.append(noteBlocksContainer);

  if (cardStyle === 'horizontal') {
    // When the card is horizontal, we only render the first block
    noteChildren.splice(1);
  } else {
    // Before rendering, we can not know the height of each block
    // But we can limit the number of blocks to render simply by the height of the card
    const cardHeight = EMBED_CARD_HEIGHT[cardStyle];
    const minSingleBlockHeight = 20;
    const maxBlockCount = Math.floor(cardHeight / minSingleBlockHeight);
    if (noteChildren.length > maxBlockCount) {
      noteChildren.splice(maxBlockCount);
    }
  }
  const childIds = noteChildren.map(child => child.id);
  const ids: string[] = [];
  childIds.map(block => {
    let parent: string | null = block;
    while (parent && !ids.includes(parent)) {
      ids.push(parent);
      parent = doc.blockCollection.crud.getParent(parent);
    }
  });
  const selector: BlockSelector = block => {
    return ids.includes(block.id)
      ? BlockViewType.Display
      : BlockViewType.Hidden;
  };
  const previewDoc = doc.blockCollection.getDoc({ selector });
  const previewSpec = SpecProvider.getInstance().getSpec('page:preview');
  const previewTemplate = card.host.renderSpecPortal(
    previewDoc,
    previewSpec.value
  );
  const fragment = document.createDocumentFragment();
  render(previewTemplate, fragment);
  noteBlocksContainer.append(fragment);
  const contentEditableElements = noteBlocksContainer.querySelectorAll(
    '[contenteditable="true"]'
  );
  contentEditableElements.forEach(element => {
    (element as HTMLElement).contentEditable = 'false';
  });
}

async function addCover(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard,
  cover: HTMLElement | TemplateResult<1>
) {
  const coverContainer = await card.bannerContainer;
  if (!coverContainer) return;
  while (coverContainer.firstChild) {
    coverContainer.firstChild.remove();
  }

  if (cover instanceof HTMLElement) {
    coverContainer.append(cover);
  } else {
    render(cover, coverContainer);
  }
}

function renderSurfaceRef(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard
) {
  card.isBannerEmpty = true;

  const surfaceRefService = card.std.spec.getService('affine:surface-ref');
  assertExists(surfaceRefService, `Surface ref service not found.`);
  card.surfaceRefService = surfaceRefService;

  card.cleanUpSurfaceRefRenderer();

  const linkedDoc = card.linkedDoc;
  assertExists(
    linkedDoc,
    `Trying to load page ${card.model.pageId} in linked page block, but the page is not found.`
  );

  card.surfaceRefRenderer = card.surfaceRefService.getRenderer(
    PathFinder.id(card.path),
    linkedDoc
  );

  card.surfaceRefRenderer.slots.mounted.on(() => {
    if (card.editorMode === 'edgeless') {
      renderEdgelessAbstract(card).catch(e => {
        console.error(e);
        card.isError = true;
      });
    } else {
      renderPageAbstract(card).catch(e => {
        console.error(e);
        card.isError = true;
      });
    }
  });
  card.surfaceRefRenderer.mount();
}

async function renderEdgelessAbstract(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard
) {
  const surfaceRefRenderer = card.surfaceRefRenderer;
  assertExists(surfaceRefRenderer, 'Surface ref renderer is not found.');

  const renderer = surfaceRefRenderer.surfaceRenderer;
  const container = document.createElement('div');
  await addCover(card, container);
  renderer.attach(container);

  // TODO: we may also need to get bounds of surface block's children
  const bounds = Array.from(
    surfaceRefRenderer.surfaceModel?.elementModels ?? []
  ).map(element => Bound.deserialize(element.xywh));
  const bound = getCommonBound(bounds);
  if (bound) {
    renderer.onResize();
    renderer.setViewportByBound(bound);
  } else {
    card.isBannerEmpty = true;
  }
}

async function renderPageAbstract(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard
) {
  const linkedDoc = card.linkedDoc;
  assertExists(
    linkedDoc,
    `Trying to load page ${card.model.pageId} in linked page block, but the page is not found.`
  );

  const notes = getNotesFromDoc(linkedDoc);
  if (!notes) {
    card.isBannerEmpty = true;
    return;
  }

  const target = notes.flatMap(note =>
    note.children.filter(child => matchFlavours(child, ['affine:image']))
  )[0];

  if (target) {
    await renderImageAbstract(card, target);
    return;
  }

  card.isBannerEmpty = true;
}

async function renderImageAbstract(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard,
  image: BlockModel
) {
  const sourceId = (image as ImageBlockModel).sourceId;
  if (!sourceId) return;

  const storage = card.linkedDoc?.blobSync;
  if (!storage) return;

  const blob = await storage.get(sourceId);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const $img = document.createElement('img');
  $img.src = url;
  await addCover(card, $img);

  card.isBannerEmpty = false;
}

export function addBlocksToDoc(
  targetDoc: Doc,
  model: BlockModel,
  parentId: string
) {
  // Add current block to linked doc
  const blockProps = getBlockProps(model);
  const newModelId = targetDoc.addBlock(
    model.flavour as BlockSuite.Flavour,
    blockProps,
    parentId
  );
  // Add children to linked doc, parent is the new model
  const children = model.children;
  if (children.length > 0) {
    children.forEach(child => {
      addBlocksToDoc(targetDoc, child, newModelId);
    });
  }
}

export function convertSelectedBlocksToLinkedDoc(
  doc: Doc,
  selectedModels: BlockModel[],
  docTitle?: string
) {
  const firstBlock = selectedModels[0];
  assertExists(firstBlock);
  // if title undefined, use the first heading block content as doc title
  const title = docTitle || getTitleFromSelectedModels(selectedModels);
  const linkedDoc = createLinkedDocFromBlocks(doc, selectedModels, title);
  // insert linked doc card
  doc.addSiblingBlocks(
    firstBlock,
    [
      {
        flavour: 'affine:embed-linked-doc',
        pageId: linkedDoc.id,
      },
    ],
    'before'
  );
  // delete selected elements
  selectedModels.forEach(model => doc.deleteBlock(model));
  return linkedDoc;
}

export function createLinkedDocFromBlocks(
  doc: Doc,
  blocks: BlockModel[],
  docTitle?: string
) {
  const linkedDoc = doc.collection.createDoc({});
  linkedDoc.load(() => {
    const rootId = linkedDoc.addBlock('affine:page', {
      title: new doc.Text(docTitle),
    });
    linkedDoc.addBlock('affine:surface', {}, rootId);
    const noteId = linkedDoc.addBlock('affine:note', {}, rootId);
    // Move blocks to linked doc recursively
    blocks.forEach(model => {
      addBlocksToDoc(linkedDoc, model, noteId);
    });
  });
  return linkedDoc;
}

export function createLinkedDocFromNote(
  doc: Doc,
  note: NoteBlockModel,
  docTitle?: string
) {
  const linkedDoc = doc.collection.createDoc({});
  linkedDoc.load(() => {
    const rootId = linkedDoc.addBlock('affine:page', {
      title: new doc.Text(docTitle),
    });
    linkedDoc.addBlock('affine:surface', {}, rootId);
    const blockProps = getBlockProps(note);
    // keep note props & show in both mode
    const noteId = linkedDoc.addBlock(
      'affine:note',
      {
        ...blockProps,
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      rootId
    );
    // Add note to linked doc recursively
    note.children.forEach(model => {
      addBlocksToDoc(linkedDoc, model, noteId);
    });
  });

  return linkedDoc;
}

export function createLinkedDocFromEdgelessElements(
  host: EditorHost,
  elements: BlockSuite.EdgelessModelType[],
  docTitle?: string
) {
  const linkedDoc = host.doc.collection.createDoc({});
  linkedDoc.load(() => {
    const rootId = linkedDoc.addBlock('affine:page', {
      title: new host.doc.Text(docTitle),
    });
    const surfaceId = linkedDoc.addBlock('affine:surface', {}, rootId);
    const surface = getSurfaceBlock(linkedDoc);
    if (!surface) return;

    const sortedElements = sortEdgelessElements(elements);
    const ids = new Map<string, string>();
    sortedElements.forEach(model => {
      let newId = model.id;
      if (model instanceof EdgelessBlockModel) {
        const blockProps = getBlockProps(model);
        if (isNoteBlock(model)) {
          newId = linkedDoc.addBlock('affine:note', blockProps, rootId);
          // Add note children to linked doc recursively
          model.children.forEach(model => {
            addBlocksToDoc(linkedDoc, model, newId);
          });
        } else {
          newId = linkedDoc.addBlock(
            model.flavour as BlockSuite.Flavour,
            blockProps,
            surfaceId
          );
        }
      } else {
        const props = getElementProps(model, ids);
        newId = surface.addElement(props);
      }
      ids.set(model.id, newId);
    });
  });
  const pageService = host.spec.getService('affine:page');
  pageService.docModeService.setMode('edgeless', linkedDoc.id);
  return linkedDoc;
}
