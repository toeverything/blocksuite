import {
  DatabaseSearchClose,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { nanoid } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { popMenu } from '../../../../../components/menu/menu.js';
import { getTagColor, selectOptionColors } from '../../../../utils/utils.js';
import { SELECT_TAG_NAME_MAX_LENGTH } from '../../../consts.js';
import type { SelectTag } from '../../../types.js';
import { SelectMode } from '../../../types.js';

const styles = css`
  affine-database-multi-tag-select {
    position: fixed;
    width: 100%;
    z-index: 2;
    border: 1px solid var(--affine-border-color);
    border-radius: 4px;
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-shadow-2);
  }

  .affine-database-select-cell-select {
    font-size: var(--affine-font-sm);
  }

  .select-input-container {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 44px;
    padding: 10px 8px;
    background: var(--affine-hover-color);
  }

  .select-input {
    flex: 1 1 0;
    height: 24px;
    border: none;
    font-family: var(--affine-font-family);
    color: inherit;
    background: transparent;
    line-height: 24px;
  }

  .select-input:focus {
    outline: none;
  }

  .select-input::placeholder {
    color: var(--affine-placeholder-color);
  }

  .select-option-container {
    padding: 8px;
    color: var(--affine-black-90);
    fill: var(--affine-black-90);
  }

  .select-option-container-header {
    padding: 8px 0px;
    color: var(--affine-black-60);
  }

  .select-input-container .select-selected {
    display: flex;
    align-items: center;
    padding: 2px 10px;
    gap: 10px;
    height: 28px;
    background: var(--affine-tag-white);
    border-radius: 4px;
    color: var(--affine-black-90);
    background: var(--affine-tertiary-color);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .select-selected-text {
    width: calc(100% - 16px);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .select-selected > .close-icon {
    display: flex;
    align-items: center;
  }

  .select-selected > .close-icon:hover {
    cursor: pointer;
  }

  .select-selected > .close-icon > svg {
    fill: var(--affine-black-90);
  }

  .select-option-new {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 36px;
    padding: 4px;
    gap: 5px;
    border-radius: 4px;
    background: var(--affine-selected-color);
  }

  .select-option-new-text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    height: 28px;
    padding: 2px 10px;
    border-radius: 4px;
    background: var(--affine-tag-red);
  }

  .select-option-new-icon {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    color: var(--affine-text-primary-color);
  }

  .select-option-new-icon svg {
    width: 16px;
    height: 16px;
  }

  .select-option {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 36px;
    padding: 4px;
    border-radius: 4px;
    margin-bottom: 4px;
    cursor: pointer;
  }

  .select-option.selected,
  .select-option:hover {
    background: var(--affine-hover-color);
  }

  .select-option-text-container {
    width: 100%;
    overflow: hidden;
    display: flex;
  }

  .select-option-name {
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .select-option-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 28px;
    height: 28px;
    border-radius: 3px;
    cursor: pointer;
    opacity: 0;
  }

  .select-option:hover .select-option-icon {
    opacity: 1;
  }

  .select-option-icon:hover {
    background: var(--affine-hover-color);
  }

  .select-option-icon svg {
    width: 16px;
    height: 16px;
    pointer-events: none;
  }
`;

@customElement('affine-database-multi-tag-select')
export class MultiTagSelect extends WithDisposable(ShadowlessElement) {
  tempValue: string | undefined = undefined;

  static override styles = styles;

  @property({ attribute: false })
  mode: SelectMode = SelectMode.Single;

  @property({ attribute: false })
  options: SelectTag[] = [];

  @property({ attribute: false })
  value: string[] = [];
  @property({ attribute: false })
  container!: HTMLElement;
  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  onChange!: (value: string[]) => void;

  @property({ attribute: false })
  editComplete!: () => void;

  @property({ attribute: false })
  newTag!: (tag: SelectTag) => void;
  @property({ attribute: false })
  deleteTag!: (id: string) => void;
  @property({ attribute: false })
  changeTag!: (tag: SelectTag) => void;

  @query('.select-input')
  private _selectInput!: HTMLInputElement;

  @state()
  private _inputValue = '';

  @state()
  private _editingId?: string;

  @state()
  private _selectedOptionIndex = -1;

  private _selectColor: string | undefined = undefined;

  get isSingleMode() {
    return this.mode === SelectMode.Single;
  }

  get selectionList() {
    return this.options;
  }

  protected override firstUpdated() {
    this._selectInput.focus();
  }

  protected override updated(_changedProperties: Map<PropertyKey, unknown>) {
    super.updated(_changedProperties);

    if (_changedProperties.has('value')) {
      this._selectInput.focus();
    }
  }

  private _onDeleteSelected = (selectedValue: string[], value: string) => {
    const filteredValue = selectedValue.filter(item => item !== value);
    this.onChange(filteredValue);
  };

  private _onInput = (event: KeyboardEvent) => {
    const value = (event.target as HTMLInputElement).value;
    this._inputValue = value;
    if (!this._selectColor) {
      this._selectColor = getTagColor();
    }
  };

  private _onSelectOrAdd = (event: KeyboardEvent, selectedValue: string[]) => {
    const inputValue = this._inputValue.trim();

    if (event.key === 'Backspace' && inputValue === '') {
      this._onDeleteSelected(
        selectedValue,
        selectedValue[selectedValue.length - 1]
      );
    } else if (event.key === 'Enter' && inputValue !== '') {
      const selectTag = this.options.find(
        item => item.value === inputValue
      )?.id;
      if (selectTag) {
        this._onSelect(selectedValue, selectTag);
      } else {
        this._onAddSelection(selectedValue);
      }
    }
  };

  private _onSelect = (selectedValue: string[], select: string) => {
    // when editing, do not select
    if (this._editingId != null) return;

    const isExist = selectedValue.findIndex(item => item === select) > -1;
    if (isExist) {
      // this.editComplete();
      return;
    }

    this.tempValue = select;
    const isSelected = selectedValue.indexOf(this.tempValue) > -1;
    if (!isSelected) {
      const newValue = this.isSingleMode
        ? [this.tempValue]
        : [...selectedValue, this.tempValue];
      this.onChange(newValue);
      if (this.isSingleMode) {
        setTimeout(() => {
          this.editComplete();
        }, 4);
      }
    }
  };

  private _onAddSelection = (selectedValue: string[]) => {
    let value = this._inputValue.trim();
    if (value === '') return;
    if (value.length > SELECT_TAG_NAME_MAX_LENGTH) {
      value = value.slice(0, SELECT_TAG_NAME_MAX_LENGTH);
    }

    const tagColor = this._selectColor ?? getTagColor();
    this._selectColor = undefined;
    const newSelect = { id: nanoid(), value, color: tagColor };
    this.newTag(newSelect);
    const newValue = this.isSingleMode
      ? [newSelect.id]
      : [...selectedValue, newSelect.id];
    this.onChange(newValue);
    this._inputValue = '';
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

  override render() {
    const filteredSelection = this.options.filter(item => {
      if (!this._inputValue) {
        return true;
      }
      return (
        item.value
          .toLocaleLowerCase()
          .indexOf(this._inputValue.toLocaleLowerCase()) > -1
      );
    });

    const selectedTag = this.value;
    const showCreateTip =
      this._inputValue &&
      filteredSelection.findIndex(item => item.value === this._inputValue) ===
        -1;
    const selectCreateTip = showCreateTip
      ? html` <div class="select-option-new" @click="${this._onAddSelection}">
          <div class="select-option-new-icon">Create ${PlusIcon}</div>
          <span
            class="select-option-new-text"
            style=${styleMap({ backgroundColor: this._selectColor })}
            >${this._inputValue}</span
          >
        </div>`
      : null;
    const map = new Map<string, SelectTag>(this.options.map(v => [v.id, v]));
    return html`
      <div class="affine-database-select-cell-select">
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
            maxlength="${SELECT_TAG_NAME_MAX_LENGTH}"
            .value="${this._inputValue}"
            @input="${this._onInput}"
            @keydown="${(event: KeyboardEvent) =>
              this._onSelectOrAdd(event, selectedTag)}"
          />
        </div>
        <div class="select-option-container">
          <div class="select-option-container-header">
            Select tag or create one
          </div>
          ${selectCreateTip}
          ${repeat(
            filteredSelection,
            select => select.id,
            (select, index) => {
              const isSelected = index === this._selectedOptionIndex;
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
                    @click="${() => this._onSelect(selectedTag, select.id)}"
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
