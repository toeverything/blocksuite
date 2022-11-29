import type { BaseBlockModel, Space } from '@blocksuite/store';
import type { EmbedBlockComponent } from '../../embed-block';
import {
  initMouseEventHandlers,
  SelectionEvent,
  caretRangeFromPoint,
  resetNativeSelection,
  assertExists,
  noop,
  handleNativeRangeDragMove,
  isBlankArea,
  handleNativeRangeClick,
  isPageTitle,
  handleNativeRangeDblClick,
  isEmbed,
} from '../../__internal__';
import type { RichText } from '../../__internal__/rich-text/rich-text';
import { repairContextMenuRange } from '../utils/cursor';
import type { DefaultPageSignals } from './default-page-block';
import { pick } from './utils';

function intersects(rect: DOMRect, selectionRect: DOMRect) {
  return (
    rect.left < selectionRect.right &&
    rect.right > selectionRect.left &&
    rect.top < selectionRect.bottom &&
    rect.bottom > selectionRect.top
  );
}

function filterSelectedRichText(
  richTextCache: Map<RichText, DOMRect>,
  selectionRect: DOMRect
): RichText[] {
  const richTexts = Array.from(richTextCache.keys());
  return richTexts.filter(richText => {
    const rect = richText.getBoundingClientRect();
    return intersects(rect, selectionRect);
  });
}
function filterSelectedEmbed(
  embedCache: Map<EmbedBlockComponent, DOMRect>,
  selectionRect: DOMRect
): EmbedBlockComponent[] {
  const embeds = Array.from(embedCache.keys());
  return embeds.filter(embed => {
    const rect = embed.getBoundingClientRect();
    return intersects(rect, selectionRect);
  });
}

function createSelectionRect(
  current: { x: number; y: number },
  start: { x: number; y: number }
) {
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  const left = Math.min(current.x, start.x);
  const top = Math.min(current.y, start.y);
  return new DOMRect(left, top, width, height);
}

type PageSelectionType = 'native' | 'block' | 'none' | 'embed';

class PageSelectionState {
  type: PageSelectionType;
  selectedRichTexts: RichText[] = [];

  private _startRange: Range | null = null;
  private _startPoint: { x: number; y: number } | null = null;
  private _richTextCache = new Map<RichText, DOMRect>();
  private _embedCache = new Map<EmbedBlockComponent, DOMRect>();
  private _optionCache: { x: number; y: number } = { x: 0, y: 0 };
  constructor(type: PageSelectionType) {
    this.type = type;
  }

  get startRange() {
    return this._startRange;
  }

  get startPoint() {
    return this._startPoint;
  }

  get richTextCache() {
    return this._richTextCache;
  }
  get embedCache() {
    return this._embedCache;
  }

  resetStartRange(e: SelectionEvent) {
    this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
    this._startPoint = { x: e.raw.clientX, y: e.raw.clientY };
  }

  refreshRichTextBoundsCache(container: HTMLElement) {
    const richTexts = Array.from(container.querySelectorAll('rich-text'));
    const embeds = Array.from(container.querySelectorAll('img-block'));
    richTexts.forEach(richText => {
      // const rect = (
      //   richText.closest(`[${BLOCK_ID_ATTR}]`) as HTMLElement
      // ).getBoundingClientRect();
      const rect = richText.getBoundingClientRect();
      this._richTextCache.set(richText, rect);
    });
    embeds.forEach(embed => {
      const rect = embed.querySelector('img')?.getBoundingClientRect();
      // @ts-ignore
      this._embedCache.set(embed, rect);
    });
  }

  clear() {
    this.type = 'none';
    this._richTextCache.clear();
    this._startRange = null;
    this._startPoint = null;
    this.selectedRichTexts = [];
  }
}

export class DefaultSelectionManager {
  space: Space;
  state = new PageSelectionState('none');
  private _container: HTMLElement;
  private _mouseDisposeCallback: () => void;
  private _signals: DefaultPageSignals;
  private _originPosition: { x: number; y: number } = { x: 0, y: 0 };
  private _dropContainer: HTMLElement | null = null;
  private _dropContainerSize: { w: number; h: number; left: number } = {
    w: 0,
    h: 0,
    left: 0,
  };
  private _activeComponent: HTMLElement | null = null;
  private _dragMoveTarget = 'right';
  constructor(
    space: Space,
    container: HTMLElement,
    signals: DefaultPageSignals
  ) {
    this.space = space;
    this._signals = signals;
    this._container = container;
    this._mouseDisposeCallback = initMouseEventHandlers(
      this._container,
      this._onContainerDragStart,
      this._onContainerDragMove,
      this._onContainerDragEnd,
      this._onContainerClick,
      this._onContainerDblClick,
      this._onContainerMouseMove,
      this._onContainerMouseOut,
      this._onContainerContextMenu
    );
  }
  private get _blocks(): BaseBlockModel[] {
    return (this.space.root?.children[0].children as BaseBlockModel[]) ?? [];
  }

  private _onBlockSelectionDragStart(e: SelectionEvent) {
    this.state.type = 'block';
    this.state.resetStartRange(e);
    this.state.refreshRichTextBoundsCache(this._container);
    resetNativeSelection(null);
  }

  private _onBlockSelectionDragMove(e: SelectionEvent) {
    assertExists(this.state.startPoint);
    const current = { x: e.raw.clientX, y: e.raw.clientY };
    const { startPoint: start } = this.state;

    const selectionRect = createSelectionRect(current, start);
    const { richTextCache, embedCache } = this.state;
    const selectedRichTexts = filterSelectedRichText(
      richTextCache,
      selectionRect
    );

    this.state.selectedRichTexts = selectedRichTexts;
    const selectedBounds = selectedRichTexts.map(richText => {
      return richTextCache.get(richText) as DOMRect;
    });
    // TODO
    // const selectedEmbed = filterSelectedEmbed(embedCache, selectionRect);
    // const selectedEmbedBounds = selectedEmbed.map(embed => {
    //   return embedCache.get(embed) as DOMRect;
    // });
    // this._signals.updateEmbedRects.emit(selectedEmbedBounds);
    this._signals.updateSelectedRects.emit(selectedBounds);
    this._signals.updateFrameSelectionRect.emit(selectionRect);
  }

  private _onBlockSelectionDragEnd(e: SelectionEvent) {
    this._signals.updateFrameSelectionRect.emit(null);
    // do not clear selected rects here
  }

  private _onNativeSelectionDragStart(e: SelectionEvent) {
    this.state.type = 'native';
  }

  private _onNativeSelectionDragMove(e: SelectionEvent) {
    handleNativeRangeDragMove(this.state.startRange, e);
  }

  private _onNativeSelectionDragEnd(e: SelectionEvent) {
    noop();
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    this.state.resetStartRange(e);
    if (isPageTitle(e.raw)) return;
    if (isEmbed(e)) {
      this._onEmbedDragStart(e);
      return;
    }
    if (isBlankArea(e)) {
      this._onBlockSelectionDragStart(e);
    } else {
      this._onNativeSelectionDragStart(e);
    }
  };

  private _onEmbedDragStart = (e: SelectionEvent) => {
    this.state.type = 'embed';
    this._originPosition.x = e.raw.pageX;
    this._originPosition.y = e.raw.pageY;
    this._dropContainer = (e.raw.target as HTMLElement).closest('.resizes');
    this._dropContainerSize.w = this._dropContainer?.getBoundingClientRect()
      .width as number;
    this._dropContainerSize.h = this._dropContainer?.getBoundingClientRect()
      .height as number;
    this._dropContainerSize.left = this._dropContainer?.offsetLeft as number;
    if ((e.raw.target as HTMLElement).className.includes('right')) {
      this._dragMoveTarget = 'right';
    } else {
      this._dragMoveTarget = 'left';
    }
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    if (this.state.type === 'native') {
      this._onNativeSelectionDragMove(e);
    } else if (this.state.type === 'block') {
      this._onBlockSelectionDragMove(e);
    } else if (this.state.type === 'embed') {
      this._onEmbedDragMove(e);
    }
  };
  private _onEmbedDragMove(e: SelectionEvent) {
    let width = 0;
    let height = 0;
    let left = 0;
    if (this._dragMoveTarget === 'right') {
      width =
        this._dropContainerSize.w + (e.raw.pageX - this._originPosition.x);
    } else {
      width =
        this._dropContainerSize.w - (e.raw.pageX - this._originPosition.x);
    }
    if (width <= 580) {
      left =
        this._dropContainerSize.left -
        (e.raw.pageX - this._originPosition.x) / 2;
      height = width * (this._dropContainerSize.h / this._dropContainerSize.w);
      if (this._dropContainer) {
        this._dropContainer.style.width = width + 'px';
        this._dropContainer.style.height = height + 'px';
        this._dropContainer.style.left = left + 'px';
        const activeImg = this._activeComponent?.querySelector('img');
        if (activeImg) {
          activeImg.style.width = width + 'px';
          activeImg.style.height = height + 'px';
        }
      }
    }
  }
  private _onContainerDragEnd = (e: SelectionEvent) => {
    if (this.state.type === 'native') {
      this._onNativeSelectionDragEnd(e);
    } else if (this.state.type === 'block') {
      this._onBlockSelectionDragEnd(e);
    }
    this.state.type = 'none';
  };

  private _onContainerClick = (e: SelectionEvent) => {
    this.state.clear();
    this._signals.updateSelectedRects.emit([]);
    this._signals.updateEmbedRects.emit([]);
    if ((e.raw.target as HTMLElement).tagName === 'DEBUG-MENU') return;
    const embedBlockComponent = (e.raw.target as HTMLElement).closest(
      'img-block'
    ) as HTMLElement;
    if (embedBlockComponent) {
      this._activeComponent = (e.raw.target as HTMLElement).closest(
        'img-block'
      );
      assertExists(this._activeComponent);
      const imageRect = this._activeComponent
        .querySelector('img')
        ?.getBoundingClientRect();
      assertExists(imageRect);
      this._signals.updateEmbedRects.emit([imageRect]);
    }
    if (e.raw.target instanceof HTMLInputElement) return;
    // TODO handle shift + click
    if (e.keys.shift) return;

    handleNativeRangeClick(this.space, e);
  };

  private _onContainerDblClick = (e: SelectionEvent) => {
    this.state.clear();
    this._signals.updateSelectedRects.emit([]);
    if ((e.raw.target as HTMLElement).tagName === 'DEBUG-MENU') return;
    if (e.raw.target instanceof HTMLInputElement) return;
    handleNativeRangeDblClick(this.space, e);
  };

  private _onContainerContextMenu = (e: SelectionEvent) => {
    repairContextMenuRange(e);
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    const hoverRect = pick(this._blocks, e.raw.pageX, e.raw.pageY);
    console.log('hoverRect: ', hoverRect);
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    // console.log('mouseout', e);
  };

  dispose() {
    this._signals.updateSelectedRects.dispose();
    this._signals.updateFrameSelectionRect.dispose();
    this._mouseDisposeCallback();
  }
  selectBlockByRect(selectionRect: DOMRect) {
    this.state.type = 'block';
    this.state.refreshRichTextBoundsCache(this._container);
    const { richTextCache } = this.state;
    const selectedRichTexts = filterSelectedRichText(
      richTextCache,
      selectionRect
    );
    this.state.selectedRichTexts = selectedRichTexts;
    const selectedBounds: DOMRect[] = [selectionRect];
    this._signals.updateSelectedRects.emit(selectedBounds);
  }
}
