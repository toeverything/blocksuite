import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel, BlockSelector, Doc } from '@blocksuite/store';
import { css, render, type TemplateResult } from 'lit';

import type { EmbedLinkedDocBlockComponent } from '../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedSyncedDocCard } from '../../embed-synced-doc-block/components/embed-synced-doc-card.js';
import type { ImageBlockModel } from '../../image-block/index.js';
import { SpecProvider } from '../../specs/utils/spec-provider.js';
import { Bound, getCommonBound } from '../../surface-block/utils/bound.js';
import { EMBED_CARD_HEIGHT } from '../consts.js';
import { NoteDisplayMode } from '../types.js';
import { matchFlavours } from './model.js';

export const embedNoteContentStyles = css`
  .affine-embed-doc-content-note-blocks affine-divider,
  .affine-embed-doc-content-note-blocks affine-divider > * {
    margin-top: 0px;
    margin-bottom: 0px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .affine-embed-doc-content-note-blocks affine-paragraph,
  .affine-embed-doc-content-note-blocks affine-list {
    margin-top: 4px;
    margin-bottom: 4px;
    padding: 0 2px;
  }
  .affine-embed-doc-content-note-blocks affine-paragraph *,
  .affine-embed-doc-content-note-blocks affine-list * {
    margin-top: 0px;
    margin-bottom: 0px;
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
    margin-top: 6px;
    margin-bottom: 4px;
    padding: 0 2px;
  }
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h1) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h2) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h3) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h4) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h5) *,
  .affine-embed-doc-content-note-blocks affine-paragraph:has(.h6) * {
    margin-top: 0px;
    margin-bottom: 0px;
    padding-top: 0;
    padding-bottom: 0;
    line-height: 20px;
    font-size: var(--affine-font-xs);
    font-weight: 600;
  }

  .affine-embed-linked-doc-block.horizontal {
    affine-paragraph,
    affine-list {
      margin-top: 0;
      margin-bottom: 0;
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
      margin-top: 4px;
      margin-bottom: 4px;
    }
  }
`;

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

function getNotesFromDoc(linkedDoc: Doc) {
  const note = linkedDoc.root?.children.filter(
    child =>
      matchFlavours(child, ['affine:note']) &&
      child.displayMode !== NoteDisplayMode.EdgelessOnly
  );

  if (!note || !note.length) {
    console.log('No note block found in linked doc.');
    return null;
  }

  return note;
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
  card.isNoteContentEmpty = false;

  const noteChildren = notes.flatMap(note =>
    note.children.filter(filterTextModel)
  );

  if (!noteChildren.length) {
    return;
  }

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
  const selector: BlockSelector = block => ids.includes(block.id);
  const previewDoc = doc.blockCollection.getDoc(selector);
  const previewSpec = SpecProvider.getInstance().getSpec('preview');
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

  const surfaceRedService = card.std.spec.getService('affine:surface-ref');
  assertExists(surfaceRedService, `Surface ref service not found.`);
  card.surfaceRefService = surfaceRedService;

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

  const storage = card.linkedDoc?.blob;
  if (!storage) return;

  const blob = await storage.get(sourceId);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const $img = document.createElement('img');
  $img.src = url;
  await addCover(card, $img);

  card.isBannerEmpty = false;
}

function moveBlocksToLinkedDoc(
  doc: Doc,
  linkedDoc: Doc,
  model: BlockModel,
  parentId: string
) {
  // Add current block to linked doc
  const keys = model.keys as (keyof typeof model)[];
  const values = keys.map(key => model[key]);
  const blockProps = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  const newModelId = linkedDoc.addBlock(
    model.flavour as never,
    blockProps,
    parentId
  );
  // Add children to linked doc, parent is the new model
  const children = model.children;
  if (children.length > 0) {
    children.forEach(child => {
      moveBlocksToLinkedDoc(doc, linkedDoc, child, newModelId);
    });
  }
  // Delete current block from original doc
  doc.deleteBlock(model);
}

export function createLinkedDocFromSelectedBlocks(
  doc: Doc,
  selectedModels: BlockModel[]
) {
  const linkedDoc = doc.collection.createDoc({});
  linkedDoc.load(() => {
    const rootId = linkedDoc.addBlock('affine:page', {
      title: new doc.Text(''),
    });
    linkedDoc.addBlock('affine:surface', {}, rootId);
    const noteId = linkedDoc.addBlock('affine:note', {}, rootId);

    const firstBlock = selectedModels[0];
    assertExists(firstBlock);

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

    if (
      matchFlavours(firstBlock, ['affine:paragraph']) &&
      firstBlock.type.match(/^h[1-6]$/)
    ) {
      const title = firstBlock.text.toString();
      linkedDoc.collection.setDocMeta(linkedDoc.id, {
        title,
      });

      const linkedDocRootModel = linkedDoc.getBlockById(rootId);
      assertExists(linkedDocRootModel);
      linkedDoc.updateBlock(linkedDocRootModel, {
        title: new doc.Text(title),
      });

      doc.deleteBlock(firstBlock);
      selectedModels.shift();
    }
    // Add selected blocks to linked doc recursively
    selectedModels.forEach(model => {
      moveBlocksToLinkedDoc(doc, linkedDoc, model, noteId);
    });
  });

  return linkedDoc;
}
