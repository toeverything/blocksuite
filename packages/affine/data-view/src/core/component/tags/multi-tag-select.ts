import {
  createPopup,
  menu,
  popMenu,
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { rangeWrap } from '@blocksuite/affine-shared/utils';
import { ShadowlessElement } from '@blocksuite/block-std';
import { IS_MOBILE } from '@blocksuite/global/env';
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
export type TagManagerOptions = {
  mode?: 'single' | 'multi';
  value: ReadonlySignal<string[]>;
  onChange: (value: string[]) => void;
  options: ReadonlySignal<SelectTag[]>;
  onOptionsChange: (options: SelectTag[]) => void;
  onComplete?: () => void;
};

class TagManager {
  changeTag = (option: SelectTag) => {
    this.ops.onOptionsChange(
      this.ops.options.value.map(item => {
        if (item.id === option.id) {
          return {
            ...item,
            ...option,
          };
        }
        return item;
      })
    );
  };

  color = signal(getTagColor());

  createOption = () => {
    const value = this.text.value.trim();
    if (value === '') return;
    const id = nanoid();
    this.ops.onOptionsChange([
      {
        id: id,
        value: value,
        color: this.color.value,
      },
      ...this.ops.options.value,
    ]);
    this.selectTag(id);
    this.text.value = '';
    this.color.value = getTagColor();
    if (this.isSingleMode) {
      this.ops.onComplete?.();
    }
  };

  deleteOption = (id: string) => {
    this.ops.onOptionsChange(
      this.ops.options.value.filter(item => item.id !== id)
    );
  };

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
          select: () => this.selectTag(option.id),
        });
      }
      if (option.value === this.text.value) {
        matched = true;
      }
    }
    if (this.text.value && !matched) {
      options.push({
        id: 'create',
        color: this.color.value,
        value: this.text.value,
        isCreate: true,
        select: this.createOption,
      });
    }
    return options;
  });

  optionsMap$ = computed(() => {
    return new Map<string, SelectTag>(
      this.ops.options.value.map(v => [v.id, v])
    );
  });

  text = signal('');

  get isSingleMode() {
    return this.ops.mode === 'single';
  }

  get options() {
    return this.ops.options;
  }

  get value() {
    return this.ops.value;
  }

  constructor(private ops: TagManagerOptions) {}

  deleteTag(id: string) {
    this.ops.onChange(this.value.value.filter(item => item !== id));
  }

  isSelected(id: string) {
    return this.value.value.includes(id);
  }

  selectTag(id: string) {
    if (this.isSelected(id)) {
      return;
    }
    const newValue = this.isSingleMode ? [id] : [...this.value.value, id];
    this.ops.onChange(newValue);
    this.text.value = '';
    if (this.isSingleMode) {
      requestAnimationFrame(() => {
        this.ops.onComplete?.();
      });
    }
  }
}

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
              this.tagManager.changeTag({
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
              this.tagManager.deleteOption(id);
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
                  this.tagManager.changeTag({
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

  private _onInput = (event: KeyboardEvent) => {
    this.tagManager.text.value = (event.target as HTMLInputElement).value;
  };

  private _onInputKeydown = (event: KeyboardEvent) => {
    event.stopPropagation();
    const inputValue = this.text.value.trim();
    if (event.key === 'Backspace' && inputValue === '') {
      this.tagManager.deleteTag(this.value.value[this.value.value.length - 1]);
    } else if (event.key === 'Enter' && !event.isComposing) {
      this.selectedTag$.value?.select();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setSelectedOption(this.selectedIndex - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setSelectedOption(this.selectedIndex + 1);
    } else if (event.key === 'Escape') {
      this.onComplete();
    }
  };

  private tagManager = new TagManager(this);

  private selectedTag$ = computed(() => {
    return this.tagManager.filteredOptions$.value[this.selectedIndex];
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
      return this.tagManager.filteredOptions$.value.map(v => v.id);
    }),
    strategy: verticalListSortingStrategy,
  });

  private get text() {
    return this.tagManager.text;
  }

  private renderInput() {
    return html`
      <div class="tag-select-input-container">
        ${this.value.value.map(id => {
          const option = this.tagManager.optionsMap$.value.get(id);
          if (!option) {
            return;
          }
          return this.renderTag(option.value, option.color, () =>
            this.tagManager.deleteTag(id)
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
          this.tagManager.filteredOptions$.value,
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
      this.tagManager.filteredOptions$.value.length
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

  @property()
  accessor mode: 'multi' | 'single' = 'multi';

  @property({ attribute: false })
  accessor onChange!: (value: string[]) => void;

  @property({ attribute: false })
  accessor onComplete!: () => void;

  @property({ attribute: false })
  accessor onOptionsChange!: (options: SelectTag[]) => void;

  @property({ attribute: false })
  accessor options!: ReadonlySignal<SelectTag[]>;

  @state()
  private accessor selectedIndex = 0;

  @property({ attribute: false })
  accessor value!: ReadonlySignal<string[]>;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-multi-tag-select': MultiTagSelect;
  }
}

const popMobileTagSelect = (target: PopupTarget, ops: TagSelectOptions) => {
  const tagManager = new TagManager(ops);
  const onInput = (e: InputEvent) => {
    tagManager.text.value = (e.target as HTMLInputElement).value;
  };
  return popMenu(target, {
    options: {
      onClose: () => {
        ops.onComplete?.();
      },
      title: {
        text: ops.name,
      },
      items: [
        () => {
          return html`
            <div
              style="padding: 12px;border-radius: 12px;background-color: ${unsafeCSSVarV2(
                'layer/background/primary'
              )};display: flex;gap:8px 12px;"
            >
              ${ops.value.value.map(id => {
                const option = ops.options.value.find(v => v.id === id);
                if (!option) {
                  return;
                }
                const style = styleMap({
                  backgroundColor: option.color,
                  width: 'max-content',
                });
                return html` <div class="tag-container" style=${style}>
                  <div class="tag-text">${option.value}</div>
                </div>`;
              })}
              <input
                .value="${tagManager.text.value}"
                @input="${onInput}"
                placeholder="Type here..."
                type="text"
                style="outline: none;border: none;flex:1;min-width: 10px"
              />
            </div>
          `;
        },
        menu.group({
          items: [
            menu.dynamic(() => {
              const options = tagManager.filteredOptions$.value;
              return options.map(option =>
                menu.action({
                  name: option.value,
                  label: () => {
                    const style = styleMap({
                      backgroundColor: option.color,
                      width: 'max-content',
                    });
                    return html`
                      <div style="display: flex; align-items:center;">
                        ${option.isCreate
                          ? html` <div style="margin-right: 8px;">Create</div>`
                          : ''}
                        <div class="tag-container" style=${style}>
                          <div class="tag-text">${option.value}</div>
                        </div>
                      </div>
                    `;
                  },
                  select: () => {
                    option.select();
                    return false;
                  },
                })
              );
            }),
          ],
        }),
      ],
    },
  });
};

export type TagSelectOptions = {
  name: string;
  minWidth?: number;
  container?: HTMLElement;
} & TagManagerOptions;
export const popTagSelect = (target: PopupTarget, ops: TagSelectOptions) => {
  if (IS_MOBILE) {
    const handler = popMobileTagSelect(target, ops);
    return () => {
      handler.close();
    };
  }
  const component = new MultiTagSelect();
  if (ops.mode) {
    component.mode = ops.mode;
  }
  const width = target.targetRect.getBoundingClientRect().width;
  component.style.width = `${Math.max(ops.minWidth ?? width, width)}px`;
  component.value = ops.value;
  component.onChange = ops.onChange;
  component.options = ops.options;
  component.onOptionsChange = ops.onOptionsChange;
  component.onComplete = () => {
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
