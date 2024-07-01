import { WithDisposable } from '@blocksuite/block-std';
import { autoPlacement, offset, type Placement, size } from '@floating-ui/dom';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { PAGE_HEADER_HEIGHT } from '../../consts.js';
import { DoneIcon } from '../../icons/database.js';
import { SearchIcon } from '../../icons/text.js';
import { type AdvancedPortalOptions, createLitPortal } from '../portal.js';
import { filterableListStyles } from './styles.js';
import type { FilterableListItem, FilterableListOptions } from './types.js';

export * from './types.js';

@customElement('affine-filterable-list')
export class FilterableListComponent<Props = unknown> extends WithDisposable(
  LitElement
) {
  static override styles = filterableListStyles;

  @query('#filter-input')
  private accessor _filterInput!: HTMLInputElement;

  @query('.filterable-item.focussed')
  private accessor _focussedItem!: HTMLElement | null;

  @state()
  private accessor _filterText = '';

  @state()
  private accessor _curFocusIndex = 0;

  @property({ attribute: false })
  accessor placement: Placement | undefined = undefined;

  @property({ attribute: false })
  accessor abortController: AbortController | null = null;

  @property({ attribute: false })
  accessor listFilter:
    | ((a: FilterableListItem<Props>, b: FilterableListItem<Props>) => number)
    | undefined = undefined;

  @property({ attribute: false })
  accessor options!: FilterableListOptions<Props>;

  private _filterItems() {
    const searchFilter = !this._filterText
      ? this.options.items
      : this.options.items.filter(
          item =>
            item.name.startsWith(this._filterText.toLowerCase()) ||
            item.aliases?.some(alias =>
              alias.startsWith(this._filterText.toLowerCase())
            )
        );
    return searchFilter.sort((a, b) => {
      const isActiveA = this.options.active?.(a);
      const isActiveB = this.options.active?.(b);

      if (isActiveA && !isActiveB) return -Infinity;
      if (!isActiveA && isActiveB) return Infinity;

      return this.listFilter?.(a, b) ?? Infinity;
    });
  }

  private _select(item: FilterableListItem) {
    this.abortController?.abort();
    this.options.onSelect(item);
  }

  private _scrollFocusedItemIntoView() {
    this.updateComplete
      .then(() => {
        this._focussedItem?.scrollIntoView({
          block: 'nearest',
          inline: 'start',
        });
      })
      .catch(console.error);
  }

  private _buildContent(items: FilterableListItem<Props>[]) {
    return items.map((item, idx) => {
      const focussed = this._curFocusIndex === idx;

      return html`
        <icon-button
          class=${classMap({
            'filterable-item': true,
            focussed,
          })}
          @mouseover=${() => (this._curFocusIndex = idx)}
          @click=${() => this._select(item)}
          hover=${focussed}
          width="100%"
          height="32px"
        >
          ${item.icon ?? nothing} ${item.label ?? item.name}
          <div slot="suffix">
            ${this.options.active?.(item) ? DoneIcon : nothing}
          </div>
        </icon-button>
      `;
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    requestAnimationFrame(() => {
      this._filterInput.focus();
    });
  }

  override render() {
    const filteredItems = this._filterItems();
    const content = this._buildContent(filteredItems);
    const isFlip = !!this.placement?.startsWith('top');

    const _handleInputKeydown = (ev: KeyboardEvent) => {
      switch (ev.key) {
        case 'ArrowUp': {
          ev.preventDefault();
          this._curFocusIndex =
            (this._curFocusIndex + content.length - 1) % content.length;
          this._scrollFocusedItemIntoView();
          break;
        }
        case 'ArrowDown': {
          ev.preventDefault();
          this._curFocusIndex = (this._curFocusIndex + 1) % content.length;
          this._scrollFocusedItemIntoView();
          break;
        }
        case 'Enter': {
          if (ev.isComposing) break;
          ev.preventDefault();
          const item = filteredItems[this._curFocusIndex];
          this._select(item);
          break;
        }
        case 'Escape': {
          ev.preventDefault();
          this.abortController?.abort();
          break;
        }
      }
    };

    return html`
      <div
        class=${classMap({ 'affine-filterable-list': true, flipped: isFlip })}
      >
        <div class="input-wrapper">
          <div class="search-icon">${SearchIcon}</div>
          <input
            id="filter-input"
            type="text"
            placeholder=${this.options?.placeholder ?? 'Search'}
            @input="${() => {
              this._filterText = this._filterInput?.value;
              this._curFocusIndex = 0;
            }}"
            @keydown="${_handleInputKeydown}"
          />
        </div>

        <div class="divider"></div>
        <div class="items-container">${content}</div>
      </div>
    `;
  }
}

export function showPopFilterableList({
  options,
  filter,
  abortController = new AbortController(),
  referenceElement,
  container,
  maxHeight = 440,
  portalStyles,
}: {
  options: FilterableListComponent['options'];
  referenceElement: Element;
  container?: Element;
  abortController?: AbortController;
  filter?: FilterableListComponent['listFilter'];
  maxHeight?: number;
  portalStyles?: AdvancedPortalOptions['portalStyles'];
}) {
  const portalPadding = {
    top: PAGE_HEADER_HEIGHT + 12,
    bottom: 12,
  } as const;

  const list = new FilterableListComponent();
  list.options = options;
  list.listFilter = filter;
  list.abortController = abortController;

  createLitPortal({
    closeOnClickAway: true,
    template: ({ positionSlot }) => {
      positionSlot.on(({ placement }) => {
        list.placement = placement;
      });

      return list;
    },
    container,
    portalStyles,
    computePosition: {
      referenceElement,
      placement: 'bottom-start',
      middleware: [
        offset(4),
        autoPlacement({
          allowedPlacements: ['top-start', 'bottom-start'],
          padding: portalPadding,
        }),
        size({
          padding: portalPadding,
          apply({ availableHeight, elements, placement }) {
            Object.assign(elements.floating.style, {
              height: '100%',
              maxHeight: `${Math.min(maxHeight, availableHeight)}px`,
              pointerEvents: 'none',
              ...(placement.startsWith('top')
                ? {
                    display: 'flex',
                    alignItems: 'flex-end',
                  }
                : {
                    display: null,
                    alignItems: null,
                  }),
            });
          },
        }),
      ],
      autoUpdate: {
        // fix the lang list position incorrectly when scrolling
        animationFrame: true,
      },
    },
    abortController,
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-filterable-list': FilterableListComponent;
  }
}
