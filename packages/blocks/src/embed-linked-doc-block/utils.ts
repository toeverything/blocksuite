import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel, Page } from '@blocksuite/store';
import { render, type TemplateResult } from 'lit';

import { DarkLoadingIcon, LightLoadingIcon } from '../_common/icons/text.js';
import { matchFlavours } from '../_common/utils/model.js';
import { getThemeMode } from '../_common/utils/query.js';
import type { ImageBlockModel } from '../image-block/image-model.js';
import type { NoteBlockModel } from '../note-block/note-model.js';
import { Bound, getCommonBound } from '../surface-block/utils/bound.js';
import { deserializeXYWH } from '../surface-block/utils/xywh.js';
import type { SurfaceRefBlockModel } from '../surface-ref-block/surface-ref-model.js';
import type { SurfaceRefBlockService } from '../surface-ref-block/surface-ref-service.js';
import type { SyncedCard } from '../synced-block/components/synced-card.js';
import type { EmbedLinkedDocBlockComponent } from './embed-linked-doc-block.js';
import type { EmbedLinkedDocStyles } from './embed-linked-doc-model.js';
import {
  DarkLinkedEdgelessDeletedLargeBanner,
  DarkLinkedEdgelessDeletedSmallBanner,
  DarkLinkedEdgelessEmptyLargeBanner,
  DarkLinkedEdgelessEmptySmallBanner,
  DarkLinkedPageDeletedLargeBanner,
  DarkLinkedPageDeletedSmallBanner,
  DarkLinkedPageEmptyLargeBanner,
  DarkLinkedPageEmptySmallBanner,
  LightLinkedEdgelessDeletedLargeBanner,
  LightLinkedEdgelessDeletedSmallBanner,
  LightLinkedEdgelessEmptyLargeBanner,
  LightLinkedEdgelessEmptySmallBanner,
  LightLinkedPageDeletedLargeBanner,
  LightLinkedPageDeletedSmallBanner,
  LightLinkedPageEmptyLargeBanner,
  LightLinkedPageEmptySmallBanner,
  LinkedDocDeletedIcon,
  LinkedEdgelessIcon,
  LinkedPageIcon,
} from './styles.js';

type EmbedCardImages = {
  LoadingIcon: TemplateResult<1>;
  LinkedDocIcon: TemplateResult<1>;
  LinkedDocDeletedIcon: TemplateResult<1>;
  LinkedDocEmptyBanner: TemplateResult<1>;
  LinkedDocDeletedBanner: TemplateResult<1>;
};

export function getEmbedLinkedDocIcons(
  pageMode: 'page' | 'edgeless',
  style: (typeof EmbedLinkedDocStyles)[number]
): EmbedCardImages {
  const theme = getThemeMode();
  const small = style !== 'vertical';
  if (pageMode === 'page') {
    if (theme === 'light') {
      return {
        LoadingIcon: LightLoadingIcon,
        LinkedDocIcon: LinkedPageIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? LightLinkedPageEmptySmallBanner
          : LightLinkedPageEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? LightLinkedPageDeletedSmallBanner
          : LightLinkedPageDeletedLargeBanner,
      };
    } else {
      return {
        LoadingIcon: DarkLoadingIcon,
        LinkedDocIcon: LinkedPageIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? DarkLinkedPageEmptySmallBanner
          : DarkLinkedPageEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? DarkLinkedPageDeletedSmallBanner
          : DarkLinkedPageDeletedLargeBanner,
      };
    }
  } else {
    if (theme === 'light') {
      return {
        LoadingIcon: LightLoadingIcon,
        LinkedDocIcon: LinkedEdgelessIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? LightLinkedEdgelessEmptySmallBanner
          : LightLinkedEdgelessEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? LightLinkedEdgelessDeletedSmallBanner
          : LightLinkedEdgelessDeletedLargeBanner,
      };
    } else {
      return {
        LoadingIcon: DarkLoadingIcon,
        LinkedDocIcon: LinkedEdgelessIcon,
        LinkedDocDeletedIcon,
        LinkedDocEmptyBanner: small
          ? DarkLinkedEdgelessEmptySmallBanner
          : DarkLinkedEdgelessEmptyLargeBanner,
        LinkedDocDeletedBanner: small
          ? DarkLinkedEdgelessDeletedSmallBanner
          : DarkLinkedEdgelessDeletedLargeBanner,
      };
    }
  }
}

export function renderDocInCard(
  block: EmbedLinkedDocBlockComponent | SyncedCard,
  doc: Page
) {
  block.abstractText = getAbstractText(doc);
  prepareSurfaceRefRenderer(block);
}

function getNoteFromPage(doc: Page) {
  const note = doc.root?.children.find(child =>
    matchFlavours(child, ['affine:note'])
  ) as NoteBlockModel | undefined;

  assertExists(
    note,
    `Trying to get note block in page ${doc.id}, but note not found.`
  );

  return note;
}

function getAbstractText(doc: Page) {
  const note = getNoteFromPage(doc);
  const blockHasText = note.children.find(child => child.text != null);
  if (!blockHasText) return '';
  return blockHasText.text!.toString();
}

async function addCover(
  block: EmbedLinkedDocBlockComponent | SyncedCard,
  cover: HTMLElement | TemplateResult<1>
) {
  const coverContainer = await block.bannerContainer;
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
  block: EmbedLinkedDocBlockComponent | SyncedCard
) {
  const surfaceRedService = block.std.spec.getService(
    'affine:surface-ref'
  ) as SurfaceRefBlockService;
  assertExists(surfaceRedService, `Surface ref service not found.`);
  block.surfaceRefService = surfaceRedService;

  block.cleanUpSurfaceRefRenderer();

  const doc = block.doc;
  assertExists(
    doc,
    `Trying to load page ${block.model.pageId} in linked page block, but the page is not found.`
  );

  block.surfaceRefRenderer = block.surfaceRefService.getRenderer(
    PathFinder.id(block.path),
    doc
  );

  block.surfaceRefRenderer.slots.mounted.on(() => {
    if (block.pageMode === 'edgeless') {
      renderEdgelessAbstract(block).catch(e => {
        console.error(e);
        block.isError = true;
      });
    } else {
      renderPageAbstract(block).catch(e => {
        console.error(e);
        block.isError = true;
      });
    }
  });
  block.surfaceRefRenderer.mount();
}

async function renderEdgelessAbstract(
  block: EmbedLinkedDocBlockComponent | SyncedCard
) {
  const surfaceRefRenderer = block.surfaceRefRenderer;
  assertExists(surfaceRefRenderer, 'Surface ref renderer is not found.');

  const renderer = surfaceRefRenderer.surfaceRenderer;
  const container = document.createElement('div');
  await addCover(block, container);
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
    block.isBannerEmpty = true;
  }
}

async function renderPageAbstract(
  block: EmbedLinkedDocBlockComponent | SyncedCard
) {
  const linkedDoc = block.doc;
  assertExists(
    linkedDoc,
    `Trying to load page ${block.model.pageId} in linked page block, but the page is not found.`
  );

  const note = getNoteFromPage(linkedDoc);
  const target = note.children.find(child =>
    matchFlavours(child, ['affine:image', 'affine:surface-ref'])
  );

  switch (target?.flavour) {
    case 'affine:image':
      await renderImageAbstract(block, target);
      return;
    case 'affine:surface-ref':
      await renderSurfaceRefAbstract(block, target);
      return;
  }

  block.isBannerEmpty = true;
}

async function renderImageAbstract(
  block: EmbedLinkedDocBlockComponent | SyncedCard,
  image: BlockModel
) {
  const sourceId = (image as ImageBlockModel).sourceId;
  if (!sourceId) return;

  const storage = block.model.page.blob;
  const blob = await storage.get(sourceId);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const $img = document.createElement('img');
  $img.src = url;
  await addCover(block, $img);

  block.isBannerEmpty = false;
}

async function renderSurfaceRefAbstract(
  block: EmbedLinkedDocBlockComponent | SyncedCard,
  surfaceRef: BlockModel
) {
  const referenceId = (surfaceRef as SurfaceRefBlockModel).reference;
  if (!referenceId) return;

  const surfaceRefRenderer = block.surfaceRefRenderer;
  if (!surfaceRefRenderer) return;

  const referencedModel = surfaceRefRenderer.getModel(referenceId);
  if (!referencedModel) return;

  const renderer = surfaceRefRenderer.surfaceRenderer;
  const container = document.createElement('div');
  await addCover(block, container);

  renderer.attach(container);
  renderer.onResize();
  const bound = Bound.fromXYWH(deserializeXYWH(referencedModel.xywh));
  renderer.setViewportByBound(bound);

  block.isBannerEmpty = false;
}
