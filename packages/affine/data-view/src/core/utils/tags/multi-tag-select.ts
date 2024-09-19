import {
  createPopup,
  popMenu,
} from '@blocksuite/affine-components/context-menu';
import { rangeWrap } from '@blocksuite/affine-shared/utils';
import { ShadowlessElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import {
  CloseIcon,
  DeleteIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/icons/lit';
import { nanoid } from '@blocksuite/store';
import { autoPlacement, flip, offset } from '@floating-ui/dom';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { stopPropagation } from '../event.js';
import { getTagColor, selectOptionColors } from './colors.js';
import { styles } from './styles.js';

export type SelectTag = {
  id: string;
  color: string;
  value: string;
  parentId?: string;
};

type RenderOption = {
  value: string;
  id: string;
  color: string;
  isCreate: boolean;
  group: SelectTag[];
  select: () => void;
};

export class MultiTagSelect extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  private _clickItemOption = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const option = this.options.find(v => v.id === id);
    if (!option) {
      return;
    }
    popMenu(e.target as HTMLElement, {
      options: {
        input: {
          initValue: option.value,
          onComplete: text => {
            this.changeTag({
              ...option,
              value: text,
            });
          },
        },
        items: [
          {
            type: 'action',
            name: 'Delete',
            icon: DeleteIcon(),
            class: 'delete-item',
            select: () => {
              this.deleteTag(id);
            },
          },
          {
            type: 'group',
            name: 'color',
            children: () =>
              selectOptionColors.map(item => {
                const styles = styleMap({
                  backgroundColor: item.color,
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                });
                return {
                  type: 'action',
                  name: item.name,
                  icon: html` <div style=${styles}></div>`,
                  isSelected: option.color === item.color,
                  select: () => {
                    this.changeTag({
                      ...option,
                      color: item.color,
                    });
                  },
                };
              }),
          },
        ],
      },
      middleware: [autoPlacement()],
    });
  };

  private _createOption = () => {
    const value = this.text.trim();
    if (value === '') return;
    const groupInfo = this.getGroupInfoByFullName(value);
    if (!groupInfo) {
      return;
    }
    const name = groupInfo.name;
    const tagColor = this.color;
    this.clearColor();
    const newSelect: SelectTag = {
      id: nanoid(),
      value: name,
      color: tagColor,
      parentId: groupInfo.parent?.id,
    };
    this.newTags([newSelect]);
    const newValue = this.isSingleMode
      ? [newSelect.id]
      : [...this.value, newSelect.id];
    this.onChange(newValue);
    this.text = '';
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
    this.text = (event.target as HTMLInputElement).value;
  };

  private _onInputKeydown = (event: KeyboardEvent) => {
    event.stopPropagation();
    const inputValue = this.text.trim();
    if (event.key === 'Backspace' && inputValue === '') {
      this._onDeleteSelected(this.value, this.value[this.value.length - 1]);
    } else if (event.key === 'Enter' && !event.isComposing) {
      this.selectedTag?.select();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setSelectedOption(this.selectedIndex - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setSelectedOption(this.selectedIndex + 1);
    } else if (event.key === 'Escape') {
      this.editComplete();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const selectTag = this.selectedTag;
      if (selectTag) {
        this.text = this.getTagFullName(selectTag, selectTag.group);
      }
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
        setTimeout(() => {
          this.editComplete();
        }, 4);
      }
    }
    this.text = '';
  };

  private filteredOptions: Array<RenderOption> = [];

  changeTag = (tag: SelectTag) => {
    this.onOptionsChange(this.options.map(v => (v.id === tag.id ? tag : v)));
  };

  deleteTag = (id: string) => {
    this.onOptionsChange(
      this.options
        .filter(v => v.id !== id)
        .map(v => ({
          ...v,
          parentId: v.parentId === id ? undefined : v.parentId,
        }))
    );
  };

  newTags = (tags: SelectTag[]) => {
    this.onOptionsChange([...tags, ...this.options]);
  };

  private get color() {
    if (!this._currentColor) {
      this._currentColor = getTagColor();
    }
    return this._currentColor;
  }

  get isSingleMode() {
    return this.mode === 'single';
  }

  private get selectedTag() {
    return this.filteredOptions[this.selectedIndex];
  }

  private _filterOptions() {
    const map = this.optionsIdMap();
    let matched = false;
    const options: RenderOption[] = this.options
      .map(v => ({
        ...v,
        group: this.getTagGroup(v, map),
      }))
      .filter(item => {
        if (!this.text) {
          return true;
        }
        return this.getTagFullName(item, item.group)
          .toLocaleLowerCase()
          .includes(this.text.toLocaleLowerCase());
      })
      .map(v => {
        const fullName = this.getTagFullName(v, v.group);
        if (fullName === this.text) {
          matched = true;
        }
        return {
          ...v,
          isCreate: false,
          select: () => this._onSelect(v.id),
        };
      });
    if (this.text && !matched) {
      options.push({
        id: 'create',
        color: this.color,
        value: this.text,
        isCreate: true,
        group: [],
        select: this._createOption,
      });
    }
    return options;
  }

  private clearColor() {
    this._currentColor = undefined;
  }

  private getGroupInfoByFullName(name: string) {
    const strings = name.split('/');
    const names = strings.slice(0, -1);
    const result: SelectTag[] = [];
    for (const text of names) {
      const parent = result[result.length - 1];
      const tag = this.options.find(
        v => v.parentId === parent?.id && v.value === text
      );
      if (!tag) {
        return;
      }
      result.push(tag);
    }
    return {
      name: strings[strings.length - 1],
      group: result,
      parent: result[result.length - 1],
    };
  }

  private getTagFullName(tag: SelectTag, group: SelectTag[]) {
    return [...group, tag].map(v => v.value).join('/');
  }

  private getTagGroup(tag: SelectTag, map = this.optionsIdMap()): SelectTag[] {
    const result = [];
    let parentId = tag.parentId;
    while (parentId) {
      const parent = map[parentId];
      result.unshift(parent);
      parentId = parent.parentId;
    }
    return result;
  }

  private optionsIdMap() {
    return Object.fromEntries(this.options.map(v => [v.id, v]));
  }

  private setSelectedOption(index: number) {
    this.selectedIndex = rangeWrap(index, 0, this.filteredOptions.length);
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
    this.filteredOptions = this._filterOptions();
    this.setSelectedOption(this.selectedIndex);
    const selectedTag = this.value;
    const map = new Map<string, SelectTag>(this.options.map(v => [v.id, v]));
    return html`
      <div class="affine-select-cell-select">
        <div class="select-input-container">
          ${selectedTag.map(id => {
            const option = map.get(id);
            if (!option) {
              return;
            }
            const style = styleMap({
              backgroundColor: option.color,
            });
            return html` <div class="select-selected" style=${style}>
              <div class="select-selected-text">${option.value}</div>
              <span
                class="close-icon"
                @click="${() => this._onDeleteSelected(selectedTag, id)}"
                >${CloseIcon()}</span
              >
            </div>`;
          })}
          <input
            class="select-input"
            placeholder="Type here..."
            .value="${this.text}"
            @input="${this._onInput}"
            @keydown="${this._onInputKeydown}"
            @pointerdown="${stopPropagation}"
          />
        </div>
        <div class="select-option-container">
          <div class="select-option-container-header">
            Select tag or create one
          </div>
          ${repeat(
            this.filteredOptions,
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
              const style = styleMap({
                backgroundColor: select.color,
              });
              const clickOption = (e: MouseEvent) =>
                this._clickItemOption(e, select.id);
              return html`
                <div class="${classes}" @mouseenter="${mouseenter}">
                  <div
                    class="select-option-text-container"
                    @click="${select.select}"
                  >
                    ${select.isCreate
                      ? html` <div class="select-option-new-icon">
                          Create ${PlusIcon()}
                        </div>`
                      : ''}
                    <div style="display:flex;flex-direction: column">
                      <div
                        style="display:flex;align-items:center;margin-bottom: 2px;opacity: 0.5;"
                      >
                        ${select.group.map((v, i) => {
                          const style = styleMap({
                            backgroundColor: v.color,
                          });
                          return html`${i === 0
                              ? ''
                              : html`<span style="margin: 0 1px">/</span>`}<span
                              class="select-option-group-name"
                              style=${style}
                              >${v.value}</span
                            >`;
                        })}
                      </div>
                      <div style="display:flex;">
                        <div style=${style} class="select-option-name">
                          ${select.value}
                        </div>
                      </div>
                    </div>
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
      </div>
    `;
  }

  @query('.select-input')
  private accessor _selectInput!: HTMLInputElement;

  @property({ attribute: false })
  accessor editComplete!: () => void;

  @property()
  accessor mode: 'multi' | 'single' = 'multi';

  @property({ attribute: false })
  accessor onChange!: (value: string[]) => void;

  @property({ attribute: false })
  accessor onOptionsChange!: (options: SelectTag[]) => void;

  @property({ attribute: false })
  accessor options: SelectTag[] = [];

  @state()
  private accessor selectedIndex = 0;

  @state()
  private accessor text = '';

  @property({ attribute: false })
  accessor value: string[] = [];
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-multi-tag-select': MultiTagSelect;
  }
}

export const popTagSelect = (
  target: HTMLElement,
  ops: {
    mode?: 'single' | 'multi';
    value: string[];
    onChange: (value: string[]) => void;
    options: SelectTag[];
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
  component.style.width = `${Math.max(
    ops.minWidth ?? target.offsetWidth,
    target.offsetWidth
  )}px`;
  component.value = ops.value;
  component.onChange = tags => {
    ops.onChange(tags);
    component.value = tags;
  };
  component.options = ops.options;
  component.onOptionsChange = options => {
    ops.onOptionsChange(options);
    component.options = options;
  };
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
