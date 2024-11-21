import {
  createPopup,
  menu,
  popMenu,
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { rangeWrap } from '@blocksuite/affine-shared/utils';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import {
  CloseIcon,
  DeleteIcon,
  MoreHorizontalIcon,
} from '@blocksuite/icons/lit';
import { nanoid } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { computed, type ReadonlySignal, signal } from '@preact/signals-core';
import { cssVarV2 } from '@toeverything/theme/v2';
import { nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { SelectTag } from '../../logical/index.js';

import { stopPropagation } from '../../utils/event.js';
import { dragHandler } from '../../utils/wc-dnd/dnd-context.js';
import { defaultActivators } from '../../utils/wc-dnd/sensors/index.js';
import {
  createSortContext,
  sortable,
} from '../../utils/wc-dnd/sort/sort-context.js';
import { verticalListSortingStrategy } from '../../utils/wc-dnd/sort/strategies/index.js';
import { arrayMove } from '../../utils/wc-dnd/utils/array-move.js';
import { getTagColor, selectOptionColors } from './colors.js';
import { styles } from './styles.js';

type RenderOption = {
  value: string;
  id: string;
  color: string;
  isCreate: boolean;
  select: () => void;
};

export class MultiTagSelect extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private _clickItemOption = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const option = this.options.value.find(v => v.id === id);
    if (!option) {
      return;
    }
    popMenu(popupTargetFromElement(e.currentTarget as HTMLElement), {
      options: {
        items: [
          menu.input({
            initialValue: option.value,
            onChange: text => {
              this.changeTag({
                ...option,
                value: text,
              });
            },
          }),
          menu.action({
            name: 'Delete',
            prefix: DeleteIcon(),
            class: {
              'delete-item': true,
            },
            select: () => {
              this.deleteTag(id);
            },
          }),
          menu.group({
            name: 'color',
            items: selectOptionColors.map(item => {
              const styles = styleMap({
                backgroundColor: item.color,
                borderRadius: '50%',
                width: '20px',
                height: '20px',
              });
              return menu.action({
                name: item.name,
                prefix: html` <div style=${styles}></div>`,
                isSelected: option.color === item.color,
                select: () => {
                  this.changeTag({
                    ...option,
                    color: item.color,
                  });
                },
              });
            }),
          }),
        ],
      },
    });
  };

  private _createOption = () => {
    const value = this.text.value.trim();
    if (value === '') return;
    const tagColor = this.color;
    this.clearColor();
    const newSelect: SelectTag = {
      id: nanoid(),
      value: value,
      color: tagColor,
    };
    this.newTags([newSelect]);
    const newValue = this.isSingleMode
      ? [newSelect.id]
      : [...this.value, newSelect.id];
    this.onChange(newValue);
    this.text.value = '';
    if (this.isSingleMode) {
      this.editComplete();
    }
  };

  private _currentColor: string | undefined = undefined;

  private _onDeleteSelected = (selectedValue: string[], value: string) => {
    const filteredValue = selectedValue.filter(item => item !== value);
    this.onChange(filteredValue);
  };

  private _onInput = (event: KeyboardEvent) => {
    this.text.value = (event.target as HTMLInputElement).value;
  };

  private _onInputKeydown = (event: KeyboardEvent) => {
    event.stopPropagation();
    const inputValue = this.text.value.trim();
    if (event.key === 'Backspace' && inputValue === '') {
      this._onDeleteSelected(this.value, this.value[this.value.length - 1]);
    } else if (event.key === 'Enter' && !event.isComposing) {
      this.selectedTag$.value?.select();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setSelectedOption(this.selectedIndex - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setSelectedOption(this.selectedIndex + 1);
    } else if (event.key === 'Escape') {
      this.editComplete();
    }
  };

  private _onSelect = (id: string) => {
    const isExist = this.value.some(item => item === id);
    if (isExist) {
      // this.editComplete();
      return;
    }

    const isSelected = this.value.indexOf(id) > -1;
    if (!isSelected) {
      const newValue = this.isSingleMode ? [id] : [...this.value, id];
      this.onChange(newValue);
      if (this.isSingleMode) {
        requestAnimationFrame(() => {
          this.editComplete();
        });
      }
    }
    this.text.value = '';
  };

  @property({ attribute: false })
  accessor options!: ReadonlySignal<SelectTag[]>;

  filteredOptions$ = computed(() => {
    let matched = false;
    const options: RenderOption[] = [];
    for (const option of this.options.value) {
      if (
        !this.text.value ||
        option.value
          .toLocaleLowerCase()
          .includes(this.text.value.toLocaleLowerCase())
      ) {
        options.push({
          ...option,
          isCreate: false,
          select: () => this._onSelect(option.id),
        });
      }
      if (option.value === this.text.value) {
        matched = true;
      }
    }
    if (this.text.value && !matched) {
      options.push({
        id: 'create',
        color: this.color,
        value: this.text.value,
        isCreate: true,
        select: this._createOption,
      });
    }
    return options;
  });

  private selectedTag$ = computed(() => {
    return this.filteredOptions$.value[this.selectedIndex];
  });

  private text = signal('');

  changeTag = (tag: SelectTag) => {
    this.onOptionsChange(
      this.options.value.map(v => (v.id === tag.id ? tag : v))
    );
  };

  deleteTag = (id: string) => {
    this.onOptionsChange(
      this.options.value
        .filter(v => v.id !== id)
        .map(v => ({
          ...v,
          parentId: v.parentId === id ? undefined : v.parentId,
        }))
    );
  };

  newTags = (tags: SelectTag[]) => {
    this.onOptionsChange([...tags, ...this.options.value]);
  };

  optionsMap$ = computed(() => {
    return new Map<string, SelectTag>(this.options.value.map(v => [v.id, v]));
  });

  sortContext = createSortContext({
    activators: defaultActivators,
    container: this,
    onDragEnd: evt => {
      const over = evt.over;
      const activeId = evt.active.id;
      if (over && over.id !== activeId) {
        this.onOptionsChange(
          arrayMove(
            this.options.value,
            this.options.value.findIndex(v => v.id === activeId),
            this.options.value.findIndex(v => v.id === over.id)
          )
        );
        this.requestUpdate();
        // const properties = this.filteredOptions$.value.map(v=>v.id);
        // const activeIndex = properties.findIndex(id => id === activeId);
        // const overIndex = properties.findIndex(id => id === over.id);
      }
    },
    modifiers: [
      ({ transform }) => {
        return {
          ...transform,
          x: 0,
        };
      },
    ],
    items: computed(() => {
      return this.filteredOptions$.value.map(v => v.id);
    }),
    strategy: verticalListSortingStrategy,
  });

  private get color() {
    if (!this._currentColor) {
      this._currentColor = getTagColor();
    }
    return this._currentColor;
  }

  get isSingleMode() {
    return this.mode === 'single';
  }

  private clearColor() {
    this._currentColor = undefined;
  }

  private renderInput() {
    return html`
      <div class="tag-select-input-container">
        ${this.value.map(id => {
          const option = this.optionsMap$.value.get(id);
          if (!option) {
            return;
          }
          return this.renderTag(option.value, option.color, () =>
            this._onDeleteSelected(this.value, id)
          );
        })}
        <input
          class="tag-select-input"
          placeholder="Type here..."
          .value="${this.text.value}"
          @input="${this._onInput}"
          @keydown="${this._onInputKeydown}"
          @pointerdown="${stopPropagation}"
        />
      </div>
    `;
  }

  private renderTag(name: string, color: string, onDelete?: () => void) {
    const style = styleMap({
      backgroundColor: color,
    });
    return html` <div class="tag-container" style=${style}>
      <div class="tag-text">${name}</div>
      ${onDelete
        ? html` <div class="tag-delete-icon" @click="${onDelete}">
            ${CloseIcon()}
          </div>`
        : nothing}
    </div>`;
  }

  private renderTags() {
    return html`
      <div
        style="height: 0.5px;background-color: ${cssVarV2(
          'layer/insideBorder/border'
        )};margin: 4px 0;"
      ></div>
      <div class="select-options-tips">Select tag or create one</div>
      <div class="select-options-container">
        ${repeat(
          this.filteredOptions$.value,
          select => select.id,
          (select, index) => {
            const isSelected = index === this.selectedIndex;
            const mouseenter = () => {
              this.setSelectedOption(index);
            };
            const classes = classMap({
              'select-option': true,
              selected: isSelected,
            });
            const clickOption = (e: MouseEvent) => {
              e.stopPropagation();
              this._clickItemOption(e, select.id);
            };
            return html`
              <div
                ${!select.isCreate ? sortable(select.id) : nothing}
                class="${classes}"
                @mouseenter="${mouseenter}"
                @click="${select.select}"
              >
                <div class="select-option-content">
                  ${select.isCreate
                    ? html` <div class="select-option-new-icon">Create</div>`
                    : html`
                        <div
                          ${dragHandler(select.id)}
                          class="select-option-drag-handler"
                        ></div>
                      `}
                  ${this.renderTag(select.value, select.color)}
                </div>
                ${!select.isCreate
                  ? html` <div
                      class="select-option-icon"
                      @click="${clickOption}"
                    >
                      ${MoreHorizontalIcon()}
                    </div>`
                  : null}
              </div>
            `;
          }
        )}
      </div>
    `;
  }

  private setSelectedOption(index: number) {
    this.selectedIndex = rangeWrap(
      index,
      0,
      this.filteredOptions$.value.length
    );
  }

  protected override firstUpdated() {
    requestAnimationFrame(() => {
      this._selectInput.focus();
    });
    this._disposables.addFromEvent(this, 'click', () => {
      this._selectInput.focus();
    });

    this._disposables.addFromEvent(this._selectInput, 'copy', e => {
      e.stopPropagation();
    });
    this._disposables.addFromEvent(this._selectInput, 'cut', e => {
      e.stopPropagation();
    });
  }

  override render() {
    this.setSelectedOption(this.selectedIndex);
    return html` ${this.renderInput()} ${this.renderTags()} `;
  }

  @query('.tag-select-input')
  private accessor _selectInput!: HTMLInputElement;

  @property({ attribute: false })
  accessor editComplete!: () => void;

  @property()
  accessor mode: 'multi' | 'single' = 'multi';

  @property({ attribute: false })
  accessor onChange!: (value: string[]) => void;

  @property({ attribute: false })
  accessor onOptionsChange!: (options: SelectTag[]) => void;

  @state()
  private accessor selectedIndex = 0;

  @property({ attribute: false })
  accessor value: string[] = [];
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-multi-tag-select': MultiTagSelect;
  }
}

export const popTagSelect = (
  target: PopupTarget,
  ops: {
    mode?: 'single' | 'multi';
    value: string[];
    onChange: (value: string[]) => void;
    options: ReadonlySignal<SelectTag[]>;
    onOptionsChange: (options: SelectTag[]) => void;
    onComplete?: () => void;
    minWidth?: number;
    container?: HTMLElement;
  }
) => {
  const component = new MultiTagSelect();
  if (ops.mode) {
    component.mode = ops.mode;
  }
  const width = target.targetRect.getBoundingClientRect().width;
  component.style.width = `${Math.max(ops.minWidth ?? width, width)}px`;
  component.value = ops.value;
  component.onChange = tags => {
    ops.onChange(tags);
    component.value = tags;
  };
  component.options = ops.options;
  component.onOptionsChange = ops.onOptionsChange;
  component.editComplete = () => {
    ops.onComplete?.();
    remove();
  };
  const remove = createPopup(target, component, {
    onClose: ops.onComplete,
    middleware: [flip(), offset({ mainAxis: -28, crossAxis: 112 })],
    container: ops.container,
  });
  return remove;
};
