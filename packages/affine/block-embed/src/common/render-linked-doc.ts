import type { SurfaceBlockModel } from '@blocksuite/affine-block-surface';

import {
  type DocMode,
  type ImageBlockModel,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import { EMBED_CARD_HEIGHT } from '@blocksuite/affine-shared/consts';
import { matchFlavours, SpecProvider } from '@blocksuite/affine-shared/utils';
import { BlockStdScope } from '@blocksuite/block-std';
import { assertExists, Bound, getCommonBound } from '@blocksuite/global/utils';
import {
  type BlockModel,
  BlockViewType,
  type Doc,
  type Query,
} from '@blocksuite/store';
import { render, type TemplateResult } from 'lit';

import type { EmbedLinkedDocBlockComponent } from '../embed-linked-doc-block/index.js';
import type { EmbedSyncedDocCard } from '../embed-synced-doc-block/components/embed-synced-doc-card.js';

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

function renderSurfaceRef(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard
) {
  card.isBannerEmpty = true;

  const surfaceRefService = card.std.getService('affine:surface-ref');
  assertExists(surfaceRefService, `Surface ref service not found.`);
  card.surfaceRefService = surfaceRefService;

  card.cleanUpSurfaceRefRenderer();

  const linkedDoc = card.linkedDoc;
  assertExists(
    linkedDoc,
    `Trying to load page ${card.model.pageId} in linked page block, but the page is not found.`
  );

  card.surfaceRefRenderer = card.surfaceRefService.getRenderer(
    card.model.id,
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
    // @ts-expect-error TODO: fix after edgeless refactor
  ).map(element => Bound.deserialize(element.xywh));
  const bound = getCommonBound(bounds);
  if (bound) {
    renderer.viewport.onResize();
    renderer.viewport.setViewportByBound(bound);
  } else {
    card.isBannerEmpty = true;
  }
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

  const cardStyle = card.model.style;
  const isHorizontal = cardStyle === 'horizontal';
  const allowFlavours: (keyof BlockSuite.BlockModels)[] = isHorizontal
    ? []
    : ['affine:image'];

  const noteChildren = notes.flatMap(note =>
    note.children.filter(model => {
      if (matchFlavours(model, allowFlavours)) {
        return true;
      }
      return filterTextModel(model);
    })
  );

  if (!noteChildren.length) {
    return;
  }

  card.isNoteContentEmpty = false;

  const noteContainer = await card.noteContainer;
  while (noteContainer.firstChild) {
    noteContainer.firstChild.remove();
  }

  const noteBlocksContainer = document.createElement('div');
  noteBlocksContainer.classList.add('affine-embed-doc-content-note-blocks');
  noteBlocksContainer.contentEditable = 'false';
  noteContainer.append(noteBlocksContainer);

  if (isHorizontal) {
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
  const query: Query = {
    mode: 'strict',
    match: ids.map(id => ({ id, viewType: BlockViewType.Display })),
  };
  const previewDoc = doc.blockCollection.getDoc({ query });
  const previewSpec = SpecProvider.getInstance().getSpec('page:preview');
  const previewStd = new BlockStdScope({
    doc: previewDoc,
    extensions: previewSpec.value,
  });
  const previewTemplate = previewStd.render();
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

function filterTextModel(model: BlockModel) {
  if (matchFlavours(model, ['affine:divider'])) {
    return true;
  }
  if (!matchFlavours(model, ['affine:paragraph', 'affine:list'])) {
    return false;
  }
  return !!model.text?.toString().length;
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
    if (surface?.elementModels.length || doc.blockSize > 2) {
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

function getSurfaceBlock(doc: Doc) {
  const blocks = doc.getBlocksByFlavour('affine:surface');
  return blocks.length !== 0 ? (blocks[0].model as SurfaceBlockModel) : null;
}
