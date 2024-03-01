import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel, Doc } from '@blocksuite/store';
import { render, type TemplateResult } from 'lit';

import type { EmbedLinkedDocBlockComponent } from '../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedSyncedDocCard } from '../../embed-synced-doc-block/components/embed-synced-doc-card.js';
import type { ImageBlockModel } from '../../image-block/index.js';
import type { NoteBlockModel } from '../../note-block/index.js';
import { Bound, getCommonBound } from '../../surface-block/utils/bound.js';
import { deserializeXYWH } from '../../surface-block/utils/xywh.js';
import type { SurfaceRefBlockModel } from '../../surface-ref-block/surface-ref-model.js';
import { matchFlavours } from './model.js';

export function renderLinkedDocInCard(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard
) {
  const linkedDoc = card.linkedDoc;
  assertExists(
    linkedDoc,
    `Trying to load page ${card.model.pageId} in linked page block, but the page is not found.`
  );

  card.abstractText = getAbstractText(linkedDoc);
  prepareSurfaceRefRenderer(card);
}

function getNoteFromPage(linkedDoc: Doc) {
  const note = linkedDoc.root?.children.find(child =>
    matchFlavours(child, ['affine:note'])
  ) as NoteBlockModel | undefined;

  assertExists(
    note,
    `Trying to get note block in page ${linkedDoc.id}, but note not found.`
  );

  return note;
}

function getAbstractText(linkedDoc: Doc) {
  const note = getNoteFromPage(linkedDoc);
  const blockHasText = note.children.find(child => child.text != null);
  if (!blockHasText) return '';
  return blockHasText.text!.toString();
}

async function addCover(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard,
  cover: HTMLElement | TemplateResult<1>
) {
  const coverContainer = await card.bannerContainer;
  if (!coverContainer) return;
  while (coverContainer.firstChild) {
    coverContainer.removeChild(coverContainer.firstChild);
  }

  if (cover instanceof HTMLElement) {
    coverContainer.appendChild(cover);
  } else {
    render(cover, coverContainer);
  }
}

function prepareSurfaceRefRenderer(
  card: EmbedLinkedDocBlockComponent | EmbedSyncedDocCard
) {
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

  const note = getNoteFromPage(linkedDoc);
  const target = note.children.find(child =>
    matchFlavours(child, ['affine:image', 'affine:surface-ref'])
  );

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
