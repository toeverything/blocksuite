import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { createPopup, popMenu } from '../../../../_common/components/index.js';
import {
  tBoolean,
  tDate,
  tNumber,
  tString,
  tTag,
} from '../../logical/data-type.js';
import { isTArray, tArray } from '../../logical/typesystem.js';
import { createUniComponentFromWebComponent } from '../../utils/uni-component/uni-component.js';
import { literalMatcher } from './matcher.js';
import { DateLiteral } from './renderer/date-literal.js';
import {
  BooleanLiteral,
  NumberLiteral,
  StringLiteral,
} from './renderer/literal-element.js';
import { MultiTagLiteral, TagLiteral } from './renderer/tag-literal.js';

literalMatcher.register(tBoolean.create(), {
  view: createUniComponentFromWebComponent(BooleanLiteral),
  popEdit: (position, { value, onChange }) => {
    popMenu(position, {
      options: {
        input: {
          search: true,
        },
        items: [true, false].map(v => {
          return {
            type: 'action',
            name: v.toString().toUpperCase(),
            isSelected: v === value,
            select: () => {
              onChange(v);
            },
          };
        }),
      },
    });
  },
});
literalMatcher.register(tString.create(), {
  view: createUniComponentFromWebComponent(StringLiteral),
  popEdit: (position, { value, onChange }) => {
    popMenu(position, {
      options: {
        input: {
          initValue: value?.toString() ?? '',
          onComplete: text => {
            onChange(text || undefined);
          },
        },
        items: [],
      },
    });
  },
});
literalMatcher.register(tNumber.create(), {
  view: createUniComponentFromWebComponent(NumberLiteral),
  popEdit: (position, { value, onChange }) => {
    popMenu(position, {
      options: {
        input: {
          initValue: value?.toString() ?? '',
          onComplete: text => {
            if (!text) {
              onChange(undefined);
              return;
            }
            const number = Number.parseFloat(text);
            if (!Number.isNaN(number)) {
              onChange(number);
            }
          },
        },
        items: [],
      },
    });
  },
});
literalMatcher.register(tArray(tTag.create()), {
  view: createUniComponentFromWebComponent(MultiTagLiteral),
  popEdit: (position, { value, onChange, type }) => {
    if (!isTArray(type)) {
      return;
    }
    if (!tTag.is(type.ele)) {
      return;
    }
    let list = Array.isArray(value) ? value : [];
    popMenu(position, {
      options: {
        input: {
          search: true,
        },
        items:
          type.ele.data?.tags.map(tag => {
            const styles = styleMap({
              backgroundColor: tag.color,
              padding: '0 8px',
              width: 'max-content',
            });
            return {
              type: 'checkbox',
              name: tag.value,
              checked: list.includes(tag.id),
              label: html` <div class="dv-round-4" style=${styles}>
                ${tag.value}
              </div>`,
              select: checked => {
                if (checked) {
                  list = list.filter(v => v !== tag.id);
                  onChange(list);
                  return false;
                } else {
                  list = [...list, tag.id];
                  onChange(list);
                  return true;
                }
              },
            };
          }) ?? [],
      },
    });
  },
});
literalMatcher.register(tTag.create(), {
  view: createUniComponentFromWebComponent(TagLiteral),
  popEdit: (position, { onChange, type }) => {
    if (!tTag.is(type)) {
      return;
    }
    popMenu(position, {
      options: {
        input: {
          search: true,
        },
        items:
          type.data?.tags.map(tag => {
            const styles = styleMap({
              backgroundColor: tag.color,
              padding: '0 8px',
              width: 'max-content',
            });
            return {
              type: 'action',
              name: tag.value,
              label: html` <div class="dv-round-4" style=${styles}>
                ${tag.value}
              </div>`,
              select: () => {
                onChange(tag.id);
              },
            };
          }) ?? [],
      },
    });
  },
});

literalMatcher.register(tDate.create(), {
  view: createUniComponentFromWebComponent(DateLiteral),
  popEdit: (position, { value, onChange }) => {
    const input = document.createElement('input');
    input.type = 'date';
    input.click();
    input.valueAsNumber = value as number;
    document.body.append(input);
    input.style.position = 'absolute';
    const close = createPopup(position, input);
    requestAnimationFrame(() => {
      input.showPicker();
      input.onchange = () => {
        onChange(input.valueAsNumber);
        close();
      };
    });
  },
});
