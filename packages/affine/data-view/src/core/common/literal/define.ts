import {
  createPopup,
  menu,
  popMenu,
} from '@blocksuite/affine-components/context-menu';
import { computed, signal } from '@preact/signals-core';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { LiteralData } from './types.js';

import {
  tBoolean,
  tDate,
  tNumber,
  tString,
  tTag,
} from '../../logical/data-type.js';
import { MatcherCreator } from '../../logical/matcher.js';
import { isTArray, tArray } from '../../logical/typesystem.js';
import { createUniComponentFromWebComponent } from '../../utils/uni-component/uni-component.js';
import { DateLiteral } from './renderer/date-literal.js';
import {
  BooleanLiteral,
  NumberLiteral,
  StringLiteral,
} from './renderer/literal-element.js';
import { MultiTagLiteral, TagLiteral } from './renderer/tag-literal.js';

const literalMatcherCreator = new MatcherCreator<LiteralData>();
export const literalMatchers = [
  literalMatcherCreator.createMatcher(tBoolean.create(), {
    view: createUniComponentFromWebComponent(BooleanLiteral),
    popEdit: (position, { value$, onChange }) => {
      popMenu(position, {
        options: {
          items: [true, false].map(v => {
            return menu.action({
              name: v.toString().toUpperCase(),
              isSelected: v === value$.value,
              select: () => {
                onChange(v);
              },
            });
          }),
        },
      });
    },
  }),
  literalMatcherCreator.createMatcher(tString.create(), {
    view: createUniComponentFromWebComponent(StringLiteral),
    popEdit: (position, { value$, onChange }) => {
      popMenu(position, {
        options: {
          items: [
            menu.input({
              initialValue: value$.value?.toString() ?? '',
              onComplete: text => {
                onChange(text || undefined);
              },
            }),
          ],
        },
      });
    },
  }),
  literalMatcherCreator.createMatcher(tNumber.create(), {
    view: createUniComponentFromWebComponent(NumberLiteral),
    popEdit: (position, { value$, onChange }) => {
      popMenu(position, {
        options: {
          items: [
            menu.input({
              initialValue: value$.value?.toString() ?? '',
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
            }),
          ],
        },
      });
    },
  }),
  literalMatcherCreator.createMatcher(tArray(tTag.create()), {
    view: createUniComponentFromWebComponent(MultiTagLiteral),
    popEdit: (position, { value$, onChange, type }) => {
      if (!isTArray(type)) {
        return;
      }
      if (!tTag.is(type.ele)) {
        return;
      }
      const list$ = signal(Array.isArray(value$.value) ? value$.value : []);
      // const list$ = computed(()=>{
      //   return Array.isArray(value$.value) ? value$.value : []
      // });
      popMenu(position, {
        options: {
          items:
            type.ele.data?.tags.map(tag => {
              const styles = styleMap({
                backgroundColor: tag.color,
                padding: '0 8px',
                width: 'max-content',
              });
              return menu.checkbox({
                name: tag.value,
                checked: computed(() => list$.value.includes(tag.id)),
                label: () =>
                  html` <div class="dv-round-4" style=${styles}>
                    ${tag.value}
                  </div>`,
                select: checked => {
                  if (checked) {
                    list$.value = list$.value.filter(v => v !== tag.id);
                    onChange(list$.value);
                    return false;
                  } else {
                    list$.value = [...list$.value, tag.id];
                    onChange(list$.value);
                    return true;
                  }
                },
              });
            }) ?? [],
        },
      });
    },
  }),
  literalMatcherCreator.createMatcher(tTag.create(), {
    view: createUniComponentFromWebComponent(TagLiteral),
    popEdit: (position, { onChange, type }) => {
      if (!tTag.is(type)) {
        return;
      }
      popMenu(position, {
        options: {
          items:
            type.data?.tags.map(tag => {
              const styles = styleMap({
                backgroundColor: tag.color,
                padding: '0 8px',
                width: 'max-content',
              });
              return menu.action({
                name: tag.value,
                label: () =>
                  html` <div class="dv-round-4" style=${styles}>
                    ${tag.value}
                  </div>`,
                select: () => {
                  onChange(tag.id);
                },
              });
            }) ?? [],
        },
      });
    },
  }),
  literalMatcherCreator.createMatcher(tDate.create(), {
    view: createUniComponentFromWebComponent(DateLiteral),
    popEdit: (position, { value$, onChange }) => {
      const input = document.createElement('input');
      input.type = 'date';
      input.click();
      input.valueAsNumber = value$.value as number;
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
  }),
];
