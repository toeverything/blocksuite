import {
  DatabaseSearchClose,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { nanoid } from '@blocksuite/store';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { popMenu } from '../menu/menu.js';
import { getTagColor, selectOptionColors } from './colors.js';
import { styles } from './styles.js';

export type SelectTag = {
  id: string;
  color: string;
  value: string;
};

@customElement('affine-multi-tag-select')
export class MultiTagSelect extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property()
  mode: 'multi' | 'single' = 'multi';

  @property({ attribute: false })
  options: SelectTag[] = [];

  @property({ attribute: false })
  onOptionsChange!: (options: SelectTag[]) => void;

  private filteredOptions: SelectTag[] = [];

  @property({ attribute: false })
  value: string[] = [];

  @property({ attribute: false })
  onChange!: (value: string[]) => void;

  @property({ attribute: false })
  editComplete!: () => void;

  newTag = (tag: SelectTag) => {
    this.onOptionsChange([tag, ...this.options]);
  };
  deleteTag = (id: string) => {
    this.onOptionsChange(this.options.filter(v => v.id !== id));
  };
  changeTag = (tag: SelectTag) => {
    this.onOptionsChange(this.options.map(v => (v.id === tag.id ? tag : v)));
  };

  @query('.select-input')
  private _selectInput!: HTMLInputElement;

  @state()
  private text = '';

  @state()
  private selectedIndex = -1;

  private _currentColor: string | undefined = undefined;

  private get color() {
    if (!this._currentColor) {
      this._currentColor = getTagColor();
    }
    return this._currentColor;
  }

  private clearColor() {
    this._currentColor = undefined;
  }

  get isSingleMode() {
    return this.mode === 'single';
  }

  protected override firstUpdated() {
    this._selectInput.focus();
  }

  private _onDeleteSelected = (selectedValue: string[], value: string) => {
    const filteredValue = selectedValue.filter(item => item !== value);
    this.onChange(filteredValue);
  };

  private _onInput = (event: KeyboardEvent) => {
    this.text = (event.target as HTMLInputElement).value;
  };

  private _onSelectOrAdd = (event: KeyboardEvent) => {
    const inputValue = this.text.trim();

    if (event.key === 'Backspace' && inputValue === '') {
      this._onDeleteSelected(this.value, this.value[this.value.length - 1]);
    } else if (event.key === 'Enter') {
      const id =
        this.filteredOptions[this.selectedIndex]?.id ??
        this.filteredOptions.find(v => v.value === this.text)?.id;
      if (id) {
        this._onSelect(id);
      } else {
        this._createOption();
      }
    } else if (event.key === 'ArrowUp') {
      this.setSelectedOption(this.selectedIndex - 1);
    } else if (event.key === 'ArrowDown') {
      this.setSelectedOption(
        (this.selectedIndex + 1) % this.filteredOptions.length
      );
    }
  };

  private setSelectedOption(index: number) {
    this.selectedIndex = Math.min(
      this.filteredOptions.length - 1,
      Math.max(-1, index)
    );
  }

  private _onSelect = (id: string) => {
    const isExist = this.value.findIndex(item => item === id) > -1;
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
  };

  private _createOption = () => {
    const value = this.text.trim();
    if (value === '') return;

    const tagColor = this.color;
    this.clearColor();
    const newSelect = { id: nanoid(), value, color: tagColor };
    this.newTag(newSelect);
    const newValue = this.isSingleMode
      ? [newSelect.id]
      : [...this.value, newSelect.id];
    this.onChange(newValue);
    this.text = '';
    if (this.isSingleMode) {
      this.editComplete();
    }
  };

  private _clickItemOption = (e: MouseEvent, id: string) => {
    const option = this.options.find(v => v.id === id);
    if (!option) {
      return;
    }
    popMenu(e.target as HTMLElement, {
      options: {
        onClose: () => this._selectInput.focus(),
        init: {},
        render: () => {
          return {
            input: {
              initValue: option.value,
              onComplete: text => {
                this.changeTag({ ...option, value: text });
              },
            },
            items: [
              {
                type: 'action',
                name: 'Delete',
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
                      marginRight: '8px',
                    });
                    return {
                      type: 'action',
                      name: item.name,
                      icon: html` <div style=${styles}></div>`,
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
          };
        },
      },
    });
  };

  private _renderCreateTip = () => {
    const showCreateTip =
      this.text &&
      this.filteredOptions.findIndex(item => item.value === this.text) === -1;
    return showCreateTip
      ? html` <div class="select-option-new" @click="${this._createOption}">
          <div class="select-option-new-icon">Create ${PlusIcon}</div>
          <span
            class="select-option-new-text"
            style=${styleMap({ backgroundColor: this.color })}
            >${this.text}</span
          >
        </div>`
      : null;
  };

  override render() {
    this.filteredOptions = this.options.filter(item => {
      if (!this.text) {
        return true;
      }
      return item.value
        .toLocaleLowerCase()
        .includes(this.text.toLocaleLowerCase());
    });

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
                >${DatabaseSearchClose}</span
              >
            </div>`;
          })}
          <input
            class="select-input"
            placeholder="Type here..."
            .value="${this.text}"
            @input="${this._onInput}"
            @keydown="${this._onSelectOrAdd}"
          />
        </div>
        <div class="select-option-container">
          <div class="select-option-container-header">
            Select tag or create one
          </div>
          ${this._renderCreateTip()}
          ${repeat(
            this.filteredOptions,
            select => select.id,
            (select, index) => {
              const isSelected = index === this.selectedIndex;
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
                <div class="${classes}">
                  <div
                    class="select-option-text-container"
                    @click="${() => this._onSelect(select.id)}"
                  >
                    <span class="select-option-name" style=${style}
                      >${select.value}</span
                    >
                  </div>
                  <div class="select-option-icon" @click="${clickOption}">
                    ${MoreHorizontalIcon}
                  </div>
                </div>
              `;
            }
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-multi-tag-select': MultiTagSelect;
  }
}
