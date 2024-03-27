import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel, Doc } from '@blocksuite/store';
import { css, render, type TemplateResult } from 'lit';

import type { EmbedLinkedDocBlockComponent } from '../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedSyncedDocCard } from '../../embed-synced-doc-block/components/embed-synced-doc-card.js';
import type { ImageBlockModel } from '../../image-block/index.js';
import { Bound, getCommonBound } from '../../surface-block/utils/bound.js';
import { deserializeXYWH } from '../../surface-block/utils/xywh.js';
import type { SurfaceRefBlockModel } from '../../surface-ref-block/surface-ref-model.js';
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
`;

export function renderLinkedDocInCard(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard
) {
  const linkedDoc = card.linkedDoc;
  assertExists(
    linkedDoc,
    `Trying to load page ${card.model.pageId} in linked page block, but the page is not found.`
  );

  renderNoteContent(card).catch(e => {
    console.error(e);
    card.isError = true;
  });

  renderSurfaceRef(card);
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
    note.children.filter(child => {
      if (matchFlavours(child, ['affine:divider'])) {
        return true;
      }
      if (!matchFlavours(child, ['affine:paragraph', 'affine:list'])) {
        return false;
      }
      return !!child.text?.toString().length;
    })
  );

  card.isNoteContentEmpty = noteChildren.length === 0;
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

  const cardHeight = EMBED_CARD_HEIGHT[cardStyle];

  if (cardStyle === 'horizontal') {
    noteChildren.splice(1);
  }

  for (const block of noteChildren) {
    const fragment = document.createDocumentFragment();
    render(card.host.renderModel(block), fragment);
    noteBlocksContainer.append(fragment);

    await card.updateComplete;
    const renderHeight = noteBlocksContainer.getBoundingClientRect().height;
    if (renderHeight >= cardHeight) {
      break;
    }
  }
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
    note.children.filter(child =>
      matchFlavours(child, ['affine:image', 'affine:surface-ref'])
    )
  )[0];

  switch (target?.flavour) {
    case 'affine:image':
      await renderImageAbstract(card, target);
      return;
    case 'affine:surface-ref':
      await renderSurfaceRefAbstract(card, target);
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

async function renderSurfaceRefAbstract(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard,
  surfaceRef: BlockModel
) {
  const referenceId = (surfaceRef as SurfaceRefBlockModel).reference;
  if (!referenceId) return;

  const surfaceRefRenderer = card.surfaceRefRenderer;
  if (!surfaceRefRenderer) return;

  const referencedModel = surfaceRefRenderer.getModel(referenceId);
  if (!referencedModel) return;

  const renderer = surfaceRefRenderer.surfaceRenderer;
  const container = document.createElement('div');
  await addCover(card, container);

  renderer.attach(container);
  renderer.onResize();
  const bound = Bound.fromXYWH(deserializeXYWH(referencedModel.xywh));
  renderer.setViewportByBound(bound);

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
